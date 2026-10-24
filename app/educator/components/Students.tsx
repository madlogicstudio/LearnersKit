 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    Users,
    GraduationCap,
    Building2,
    Search,
    RefreshCw,
    Eye,
    X,
    FilterX,
    AlertCircle,
    Mail,
    Hash,
    BookOpen,
    CalendarDays,
    ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Student = {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string | null;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type EducatorProfile = {
    role: string;
    admin_id: string | null;
};

export default function Students() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("all");
    const [program, setProgram] = useState("all");
    const [yearLevel, setYearLevel] = useState("all");

    const [selectedStudent, setSelectedStudent] =
        useState<Student | null>(null);


const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
        const supabase = createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Please sign in again.");

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, admin_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        if (profile.role !== "educator") {
            throw new Error("Only educators can access this page.");
        }

        if (!profile.admin_id) {
            throw new Error("Your educator account is not linked to an admin.");
        }

        // Get the subjects assigned to the educator.
        const { data: assignments, error: assignmentError } = await supabase
            .from("subject_assignments")
            .select("subject_id")
            .eq("educator_id", user.id)
            .eq("admin_id", profile.admin_id);

        if (assignmentError) throw assignmentError;

        const subjectIds = [
            ...new Set((assignments ?? []).map((item) => item.subject_id)),
        ];

        if (subjectIds.length === 0) {
            setStudents([]);
            return;
        }

        console.log("Logged-in educator:", user.id);
        console.log("Profile:", profile);
        console.log("Assignments:", assignments);
        console.log("Assignment error:", assignmentError);

        // Find students enrolled in the assigned subjects.
        const { data: enrollments, error: enrollmentError } = await supabase
            .from("student_subjects")
            .select("student_id")
            .eq("admin_id", profile.admin_id)
            .in("subject_id", subjectIds);

        if (enrollmentError) throw enrollmentError;

        const studentIds = [
            ...new Set((enrollments ?? []).map((item) => item.student_id)),
        ];

        if (studentIds.length === 0) {
            setStudents([]);
            return;
        }

console.log("Admin ID:", profile.admin_id);
console.log("Student IDs to fetch:", studentIds);

const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select(`
        id,
        student_number,
        first_name,
        last_name,
        email,
        gender,
        department,
        academic_program,
        year_level
    `)
    .eq("admin_id", profile.admin_id)
    .in("id", studentIds);

console.log("Student data:", studentData);
console.log("Student error:", studentError);

if (studentError) {
    throw studentError;
}

setStudents(studentData ?? []);
    } catch (err) {
        console.error("Failed to load educator students:", err);

        setStudents([]);

        setError(
            err instanceof Error
                ? err.message
                : "Failed to load student records."
        );
    } finally {
        setLoading(false);
    }
}, []);


useEffect(() => {
    loadStudents();
}, [loadStudents]);

    const departments = useMemo(
        () =>
            Array.from(
                new Set(
                    students
                        .map((student) => student.department)
                        .filter((value): value is string => Boolean(value))
                )
            ).sort(),
        [students]
    );

    const programs = useMemo(
        () =>
            Array.from(
                new Set(
                    students
                        .map((student) => student.academic_program)
                        .filter((value): value is string => Boolean(value))
                )
            ).sort(),
        [students]
    );

    const yearLevels = useMemo(
        () =>
            Array.from(
                new Set(
                    students
                        .map((student) => student.year_level)
                        .filter((value): value is string => Boolean(value))
                )
            ).sort(),
        [students]
    );

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();

        return students.filter((student) => {
            const matchesSearch =
                !term ||
                [
                    student.student_number,
                    student.first_name,
                    student.last_name,
                    student.email,
                    student.department,
                    student.academic_program,
                ].some((value) =>
                    value?.toLowerCase().includes(term)
                );

            const matchesDepartment =
                department === "all" ||
                student.department === department;

            const matchesProgram =
                program === "all" ||
                student.academic_program === program;

            const matchesYear =
                yearLevel === "all" ||
                student.year_level === yearLevel;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesProgram &&
                matchesYear
            );
        });
    }, [students, search, department, program, yearLevel]);

    const clearFilters = () => {
        setSearch("");
        setDepartment("all");
        setProgram("all");
        setYearLevel("all");
    };

    const hasFilters =
        search !== "" ||
        department !== "all" ||
        program !== "all" ||
        yearLevel !== "all";

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto hide-scrollbar p-3">
             
            <div className="sm:my-6 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="px-3">
                    <h1 className="text-2xl font-bold tracking-tight ">
                        Students
                    </h1>
                    <p className="mt-3 text-sm text-foreground/60">
                        View student records and academic information.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadStudents()}
                    disabled={loading}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:shadow-md disabled:opacity-50 dark:bg-[var(--card)] sm:self-auto"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Main student records panel */}
            <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                <div className="mb-5">
                    <h2 className="text-base font-semibold text-foreground">
                        Student Records
                    </h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Search and filter students by department, program,
                        and year level.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div className="relative lg:col-span-2">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search students..."
                            className="w-full rounded-xl border border-foreground/20 bg-transparent py-3 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-foreground/45 focus:border-[var(--primary)]"
                        />
                    </div>

                    <div className="relative">               
                        <select
                            value={department}
                            onChange={(event) =>
                                setDepartment(event.target.value)
                            }
                            className=" cursor-pointer bg-white dark:bg-[var(--card)] w-full appearance-none rounded-xl border border-foreground/20 bg-transparent px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--primary)]"
                        >
                            <option value="all">All Departments</option>
                            {departments.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                        />
                    </div>  

                    <div className="relative">                
                        <select
                            value={yearLevel}
                            onChange={(event) =>
                                setYearLevel(event.target.value)
                            }
                            className="cursor-pointer bg-white dark:bg-[var(--card)] appearance-none w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--primary)]"
                        >
                            <option value="all">All Year Levels</option>
                            {yearLevels.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                        />
                    </div>

                    <div className="relative">        
                        <select
                            value={program}
                            onChange={(event) =>
                                setProgram(event.target.value)
                            }
                            className="cursor-pointer bg-white dark:bg-[var(--card)] appearance-none w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--primary)] lg:col-span-2"
                        >
                            <option value="all" className="">All Academic Programs</option>
                            {programs.map((item) => (
                                <option key={item} value={item} >
                                    {item}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                        />
                    </div>    

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/20 px-3 py-3 text-sm text-foreground/70 transition hover:bg-muted lg:col-span-2"
                        >
                            <FilterX size={16} />
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Error state */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                    >
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1">{error}</div>
                        <button
                            type="button"
                            onClick={() => void loadStudents()}
                            className="font-medium underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="flex min-h-56 items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-foreground/60">
                            <RefreshCw
                                size={18}
                                className="animate-spin text-[var(--primary)]"
                            />
                            Loading student records...
                        </div>
                    </div>
                ) : !error && filteredStudents.length === 0 ? (
                    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-foreground/20 px-5 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-[var(--primary)] dark:bg-purple-950/30">
                            <Users size={26} />
                        </div>

                        <h3 className="font-semibold text-foreground">
                            {students.length === 0
                                ? "No student records yet"
                                : "No students found"}
                        </h3>

                        <p className="mt-2 max-w-sm text-sm text-foreground/60">
                            {students.length === 0
                                ? "Student records available to your account will appear here."
                                : "Try a different search term or change your filters."}
                        </p>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : !error ? (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-hidden rounded-xl border border-foreground/20 md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead className="border-b border-foreground/20 bg-muted/30">
                                        <tr>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Student
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Student Number
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Department
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Academic Program
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Year Level
                                            </th>
                                            <th className="px-4 py-4 text-right font-medium text-foreground/60">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-foreground/20">
                                        {filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="transition hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar student={student} />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-foreground">
                                                                {student.first_name}{" "}
                                                                {student.last_name}
                                                            </p>
                                                            <p className="mt-1 max-w-52 truncate text-xs text-foreground/50">
                                                                {student.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-foreground/70">
                                                    {student.student_number}
                                                </td>

                                                <td className="px-4 py-4 text-foreground/70">
                                                    {student.department || "—"}
                                                </td>

                                                <td className="px-4 py-4 text-foreground/70">
                                                    {student.academic_program || "—"}
                                                </td>

                                                <td className="px-4 py-4 text-foreground/70">
                                                    {student.year_level || "—"}
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedStudent(student)
                                                        }
                                                        aria-label={`View ${student.first_name} ${student.last_name}`}
                                                        className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-foreground/20 px-3 py-2 text-xs font-medium text-foreground transition hover:border-[var(--primary)] hover:text-[var(--secondary)]"
                                                    >
                                                        <Eye size={15} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-foreground/20 px-4 py-3 text-sm text-foreground/50">
                                Showing {filteredStudents.length} of{" "}
                                {students.length} students
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {filteredStudents.map((student) => (
                                <article
                                    key={student.id}
                                    className="overflow-hidden rounded-xl border border-foreground/20"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-foreground/20 p-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar student={student} />
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground">
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </h3>
                                                <p className="mt-1 truncate text-xs text-foreground/50">
                                                    {student.student_number}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedStudent(student)
                                            }
                                            aria-label={`View ${student.first_name} ${student.last_name}`}
                                            className="shrink-0 rounded-lg p-2 text-foreground/60 hover:bg-muted hover:text-[var(--primary)]"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 p-4">
                                        <InfoItem
                                            label="Department"
                                            value={student.department || "—"}
                                        />
                                        <InfoItem
                                            label="Year Level"
                                            value={student.year_level || "—"}
                                        />
                                        <InfoItem
                                            label="Academic Program"
                                            value={student.academic_program || "—"}
                                        />
                                        <InfoItem
                                            label="Email"
                                            value={student.email || "—"}
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>

                        <p className="mt-4 text-xs text-foreground/50 md:hidden">
                            Showing {filteredStudents.length} of{" "}
                            {students.length} students
                        </p>
                    </>
                ) : null}
            </section>

            {/* Student details modal */}
            {selectedStudent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedStudent(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="student-modal-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-foreground/20 bg-white p-6 shadow-2xl dark:bg-[var(--card)]"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2
                                    id="student-modal-title"
                                    className="text-lg font-semibold text-foreground"
                                >
                                    Student Details
                                </h2>
                                <p className="mt-1 text-sm text-foreground/60">
                                    Student academic information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedStudent(null)}
                                aria-label="Close student details"
                                className="cursor-pointer ml-auto rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6 flex flex-col items-center rounded-xl bg-[var(--accent)] dark:bg-[#24232E] p-5 text-center">
                            <Avatar student={selectedStudent} large />
                            <h3 className="mt-3 text-lg font-semibold text-foreground">
                                {selectedStudent.first_name}{" "}
                                {selectedStudent.last_name}
                            </h3>
                            <p className="mt-1 text-sm text-foreground/60">
                                {selectedStudent.student_number}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <DetailRow
                                icon={<Mail size={18} />}
                                label="Email Address"
                                value={selectedStudent.email || "—"}
                            />
                            <DetailRow
                                icon={<Hash size={18} />}
                                label="Student Number"
                                value={selectedStudent.student_number || "—"}
                            />
                            <DetailRow
                                icon={<Users size={18} />}
                                label="Gender"
                                value={selectedStudent.gender || "Not specified"}
                            />
                            <DetailRow
                                icon={<Building2 size={18} />}
                                label="Department"
                                value={selectedStudent.department || "—"}
                            />
                            <DetailRow
                                icon={<BookOpen size={18} />}
                                label="Academic Program"
                                value={selectedStudent.academic_program || "—"}
                            />
                            <DetailRow
                                icon={<CalendarDays size={18} />}
                                label="Year Level"
                                value={selectedStudent.year_level || "—"}
                            />
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function Avatar({
    student,
    large = false,
}: {
    student: Student;
    large?: boolean;
}) {
    const initials =
        `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

    return (
        <div
            className={`rounded-xl flex shrink-0 items-center justify-center rounded-xlfont-semibold bg-[var(--primary)] text-white ${
                large ? "h-16 w-16 text-xl" : "h-11 w-11 text-md"
            }`}
        >
            {initials || <Users size={large ? 26 : 19} />}
        </div>
    );
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-foreground/50">{label}</p>
            <p className="mt-1 break-words text-sm text-foreground">{value}</p>
        </div>
    );
}

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[var(--primary)]">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground/50">{label}</p>
                <p className="mt-1 break-words text-sm text-foreground">
                    {value}
                </p>
            </div>
        </div>
    );
}
