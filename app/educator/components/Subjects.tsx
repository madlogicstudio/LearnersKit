"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    BookOpen,
    Building2,
    GraduationCap,
    Search,
    RefreshCw,
    ChevronDown,
    Eye,
    X,
    FilterX,
    AlertCircle,
    CalendarDays,
    Hash,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Subject = {
    id: string;
    name: string;
    department_id: string | null;
    department_name: string;
};

type Department = {
    id: string;
    name: string;
};

type EducatorProfile = {
    role: string;
    admin_id: string | null;
};

export default function Subjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("all");
    const [selectedSubject, setSelectedSubject] =
        useState<Subject | null>(null);

    
    
const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
        const supabase = createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
            throw new Error("Please sign in to view your subjects.");
        }

        // Get the educator's profile and linked administrator.
        const { data: profileData, error: profileError } =
            await supabase
                .from("profiles")
                .select("role, admin_id")
                .eq("id", user.id)
                .single();

        if (profileError) throw profileError;

        const profile = profileData as EducatorProfile;

        if (profile.role !== "educator") {
            throw new Error(
                "Only educator accounts can access this page."
            );
        }

        if (!profile.admin_id) {
            throw new Error(
                "Your educator account is not linked to an administrator."
            );
        }

        const adminId = profile.admin_id;

        // Fetch only subjects assigned to this educator.
        const { data: assignments, error: assignmentError } =
            await supabase
                .from("subject_assignments")
                .select("subject_id")
                .eq("educator_id", user.id)
                .eq("admin_id", adminId);

        if (assignmentError) throw assignmentError;

        const subjectIds = [
            ...new Set(
                (assignments ?? []).map((assignment) => assignment.subject_id)
            ),
        ];

        // No assignments means there are no subjects to display.
        if (subjectIds.length === 0) {
            setSubjects([]);
            return;
        }

        // Fetch assigned subjects and their academic information.
        const [
            { data: subjectData, error: subjectError },
            { data: yearData, error: yearError },
            { data: courseData, error: courseError },
            { data: departmentData, error: departmentError },
        ] = await Promise.all([
            supabase
                .from("subjects")
                .select("id, name, code, year_level_id")
                .eq("admin_id", adminId)
                .in("id", subjectIds)
                .order("name", { ascending: true }),

            supabase
                .from("year_levels")
                .select("id, course_id, name, year_number")
                .eq("admin_id", adminId),

            supabase
                .from("courses")
                .select("id, name, department_id")
                .eq("admin_id", adminId),

            supabase
                .from("departments")
                .select("id, name")
                .eq("admin_id", adminId),
        ]);

        if (subjectError) throw subjectError;
        if (yearError) throw yearError;
        if (courseError) throw courseError;
        if (departmentError) throw departmentError;

        const yearMap = new Map(
            (yearData ?? []).map((item) => [item.id, item])
        );

        const courseMap = new Map(
            (courseData ?? []).map((item) => [item.id, item])
        );

        const departmentMap = new Map(
            (departmentData ?? []).map((item) => [
                item.id,
                item.name,
            ])
        );

        const formattedSubjects: Subject[] = (subjectData ?? []).map(
            (subject) => {
                const year = yearMap.get(subject.year_level_id);
                const course = year
                    ? courseMap.get(year.course_id)
                    : undefined;

                return {
                    id: subject.id,
                    name: subject.name,
                    department_id: course?.department_id ?? null,
                    department_name: course?.department_id
                        ? departmentMap.get(course.department_id) ??
                          "Unassigned"
                        : "Unassigned",
                };
            }
        );

        setSubjects(formattedSubjects);
    } catch (err) {
        console.error("Failed to load subjects:", err);

        setError(
            err instanceof Error
                ? err.message
                : "Something went wrong while loading subjects."
        );
    } finally {
        setLoading(false);
    }
}, []);


    useEffect(() => {
        void loadSubjects();
    }, [loadSubjects]);

    const departments = useMemo(
        () =>
            Array.from(
                new Set(
                    subjects
                        .map((subject) => subject.department_name)
                        .filter((name) => name !== "Unassigned")
                )
            ).sort(),
        [subjects]
    );

    const filteredSubjects = useMemo(() => {
        const term = search.trim().toLowerCase();

        return subjects.filter((subject) => {
            const matchesSearch =
                !term ||
                subject.name.toLowerCase().includes(term) ||
                subject.department_name.toLowerCase().includes(term) ||
                subject.id.toLowerCase().includes(term);

            const matchesDepartment =
                department === "all" ||
                subject.department_name === department;

            return matchesSearch && matchesDepartment;
        });
    }, [subjects, search, department]);

    const clearFilters = () => {
        setSearch("");
        setDepartment("all");
    };

    const hasFilters = search !== "" || department !== "all";

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto hide-scrollbar p-3">
            {/* Page heading */}
            <div className="sm:my-6 mb-6 flex flex-col gap-4 px-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Subjects
                    </h1>
                    <p className="mt-3 text-sm text-foreground/60">
                        View your subjects and their academic departments.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadSubjects()}
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

            {/* Subjects panel */}
            <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                <div className="mb-5">
                    <h2 className="text-base font-semibold text-foreground">
                        Subject Records
                    </h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Search and filter subjects by name and department.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div className="relative lg:col-span-3">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search subjects..."
                            className="w-full rounded-xl border border-foreground/20 bg-transparent py-3 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-foreground/45 focus:border-[var(--primary)]"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={department}
                            onChange={(event) =>
                                setDepartment(event.target.value)
                            }
                            className="w-full cursor-pointer appearance-none rounded-xl border border-foreground/20 bg-white px-3 py-3 pr-9 text-sm text-foreground outline-none focus:border-[var(--primary)] dark:bg-[var(--card)]"
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

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/20 px-3 py-3 text-sm text-foreground/70 transition hover:bg-muted"
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
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <div className="flex-1">{error}</div>
                        <button
                            type="button"
                            onClick={() => void loadSubjects()}
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
                            Loading subjects...
                        </div>
                    </div>
                ) : !error && filteredSubjects.length === 0 ? (
                    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-foreground/20 px-5 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                            <BookOpen size={26} />
                        </div>

                        <h3 className="font-semibold text-foreground">
                            {subjects.length === 0
                                ? "No subjects yet"
                                : "No subjects found"}
                        </h3>

                        <p className="mt-2 max-w-sm text-sm text-foreground/60">
                            {subjects.length === 0
                                ? "Subjects created by your administrator will appear here."
                                : "Try another search term or change your department filter."}
                        </p>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="cursor-pointer mt-4 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
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
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="border-b border-foreground/20 bg-muted/30">
                                        <tr>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Subject
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Subject ID
                                            </th>
                                            <th className="px-4 py-4 font-medium text-foreground/60">
                                                Department
                                            </th>
                                            <th className="px-4 py-4 text-right font-medium text-foreground/60">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-foreground/20">
                                        {filteredSubjects.map((subject) => (
                                            <tr
                                                key={subject.id}
                                                className="transition hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <SubjectIcon />
                                                        <span className="font-medium text-foreground">
                                                            {subject.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-foreground/60">
                                                    <span className="font-mono text-xs">
                                                        {subject.id}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-foreground/70">
                                                    {subject.department_name}
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedSubject(subject)
                                                        }
                                                        aria-label={`View ${subject.name}`}
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
                                Showing {filteredSubjects.length} of{" "}
                                {subjects.length} subjects
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {filteredSubjects.map((subject) => (
                                <article
                                    key={subject.id}
                                    className="overflow-hidden rounded-xl border border-border"
                                >
                                    <div className="flex items-center justify-between gap-3 p-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <SubjectIcon />
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-foreground">
                                                    {subject.name}
                                                </h3>
                                                <p className="mt-1 truncate text-xs text-foreground/50">
                                                    {subject.department_name}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedSubject(subject)
                                            }
                                            aria-label={`View ${subject.name}`}
                                            className="shrink-0 rounded-lg p-2 text-foreground/60 hover:bg-muted hover:text-[var(--primary)]"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <p className="mt-4 text-xs text-foreground/50 md:hidden">
                            Showing {filteredSubjects.length} of{" "}
                            {subjects.length} subjects
                        </p>
                    </>
                ) : null}
            </section>

            {/* Subject details modal */}
            {selectedSubject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedSubject(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="subject-modal-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl dark:bg-[var(--card)]"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2
                                    id="subject-modal-title"
                                    className="text-lg font-semibold text-foreground"
                                >
                                    Subject Details
                                </h2>
                                <p className="mt-1 text-sm text-foreground/60">
                                    Subject academic information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedSubject(null)}
                                aria-label="Close subject details"
                                className="cursor-pointer ml-auto rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6 flex flex-col items-center rounded-xl bg-purple-50/70 p-5 text-center dark:bg-purple-950/20">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                <BookOpen size={30} />
                            </div>
                            <h3 className="mt-3 text-lg font-semibold text-foreground">
                                {selectedSubject.name}
                            </h3>
                            <p className="mt-1 text-sm text-foreground/60">
                                {selectedSubject.department_name}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <DetailRow
                                icon={<BookOpen size={18} />}
                                label="Subject Name"
                                value={selectedSubject.name}
                            />
                            <DetailRow
                                icon={<Hash size={18} />}
                                label="Subject ID"
                                value={selectedSubject.id}
                            />
                            <DetailRow
                                icon={<Building2 size={18} />}
                                label="Department"
                                value={selectedSubject.department_name}
                            />
                            <DetailRow
                                icon={<CalendarDays size={18} />}
                                label="Academic Information"
                                value="Additional course information is not configured."
                            />
                        </div>

                    </section>
                </div>
            )}
        </div>
    );
}

function SubjectIcon() {
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
            <BookOpen size={20} />
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
