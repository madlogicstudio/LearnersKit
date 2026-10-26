
"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Download,
    FileSpreadsheet,
    GraduationCap,
    RefreshCw,
    UserRound,
} from "lucide-react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
    id: string;
    full_name: string | null;
    admin_id: string | null;
    role: string;
};

type StudentRecord = {
    id: string;
    student_number: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    gender: string | null;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type SubjectRecord = {
    id: string;
    name: string;
    code: string | null;
};

type EnrollmentRecord = {
    subject_id: string;
};

type AttendanceRecord = {
    status: string | null;
};

type GradeRecord = {
    id: string;
    subject_id: string;
    requirement_id: string | null;
    grading_period: string | null;
    semester: string | null;
    grade: number | string | null;
    remarks: string | null;
    created_at: string;
};

type RequirementRecord = {
    id: string;
    name: string;
    requirement_type: string | null;
    subject_id: string;
};

type AcademicGrade = GradeRecord & {
    subject_name: string;
    requirement_name: string;
    requirement_type: string;
};

type AcademicData = {
    student: StudentRecord;
    subjects: SubjectRecord[];
    grades: AcademicGrade[];
    attendance: AttendanceRecord[];
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function csvCell(value: unknown): string {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function SectionHeading({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof UserRound;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                <Icon size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                    {title}
                </h2>
                <p className="mt-1 text-sm leading-5 text-foreground/55">
                    {description}
                </p>
            </div>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: typeof BookOpen;
}) {
    return (
        <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground/60">
                        {title}
                    </p>
                    <p className="mt-3 break-words text-3xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                    <Icon size={22} />
                </div>
            </div>

            <p className="mt-4 text-sm leading-5 text-foreground/50">
                {description}
            </p>
        </article>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-foreground/15 px-4 py-10 text-center">
            <FileSpreadsheet
                size={28}
                className="mx-auto text-foreground/35"
            />
            <p className="mt-3 text-sm text-foreground/55">{message}</p>
        </div>
    );
}

export default function AcademicRecords() {
    const [data, setData] = useState<AcademicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const loadRecords = useCallback(async () => {
        const supabase = createClient();

        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                window.location.replace("/login");
                return;
            }

            const { data: profileData, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("id, full_name, admin_id, role")
                    .eq("id", user.id)
                    .single();

            if (profileError) throw profileError;

            const profile = profileData as StudentProfile;

            if (profile.role !== "student") {
                window.location.replace("/login");
                return;
            }

            if (!profile.admin_id) {
                throw new Error(
                    "Your account is not linked to an administrator. Please contact your school administrator."
                );
            }

            const { data: studentData, error: studentError } =
                await supabase
                    .from("students")
                    .select(
                        "id, student_number, first_name, last_name, email, gender, department, academic_program, year_level"
                    )
                    .eq("user_id", user.id)
                    .eq("admin_id", profile.admin_id)
                    .maybeSingle();

            if (studentError) throw studentError;

            if (!studentData) {
                throw new Error(
                    "Your student record could not be found. Please contact your school administrator."
                );
            }

            const student = studentData as StudentRecord;

            const [
                enrollmentsResult,
                attendanceResult,
                gradesResult,
            ] = await Promise.all([
                supabase
                    .from("student_subjects")
                    .select("subject_id")
                    .eq("admin_id", profile.admin_id)
                    .eq("student_id", student.id),

                supabase
                    .from("attendance")
                    .select("status")
                    .eq("admin_id", profile.admin_id)
                    .eq("student_id", student.id),

                supabase
                    .from("grades")
                    .select(
                        "id, subject_id, requirement_id, grading_period, semester, grade, remarks, created_at"
                    )
                    .eq("admin_id", profile.admin_id)
                    .eq("student_id", student.id)
                    .order("created_at", { ascending: false }),
            ]);

            if (enrollmentsResult.error) {
                throw new Error(
                    `Enrollments: ${enrollmentsResult.error.message}`
                );
            }

            if (attendanceResult.error) {
                throw new Error(
                    `Attendance: ${attendanceResult.error.message}`
                );
            }

            if (gradesResult.error) {
                throw new Error(`Grades: ${gradesResult.error.message}`);
            }

            const enrollments = (enrollmentsResult.data ??
                []) as EnrollmentRecord[];

            const attendance = (attendanceResult.data ??
                []) as AttendanceRecord[];

            const gradeRows = (gradesResult.data ?? []) as GradeRecord[];

            const subjectIds = [
                ...new Set(enrollments.map((item) => item.subject_id)),
            ];

            let subjects: SubjectRecord[] = [];

            if (subjectIds.length > 0) {
                const { data: subjectData, error: subjectError } =
                    await supabase
                        .from("subjects")
                        .select("id, name, code")
                        .eq("admin_id", profile.admin_id)
                        .in("id", subjectIds)
                        .order("name", { ascending: true });

                if (subjectError) throw subjectError;

                subjects = (subjectData ?? []) as SubjectRecord[];
            }

            // Fetch requirement names separately so grades do not depend
            // on a Supabase embedded relationship being configured.
            const requirementIds = [
                ...new Set(
                    gradeRows
                        .map((grade) => grade.requirement_id)
                        .filter((id): id is string => Boolean(id))
                ),
            ];

            let requirements: RequirementRecord[] = [];

            if (requirementIds.length > 0) {
                const { data: requirementData, error: requirementError } =
                    await supabase
                        .from("academic_requirements")
                        .select("id, name, requirement_type, subject_id")
                        .eq("admin_id", profile.admin_id)
                        .in("id", requirementIds);

                if (requirementError) throw requirementError;

                requirements = (requirementData ??
                    []) as RequirementRecord[];
            }

            const subjectMap = new Map(
                subjects.map((subject) => [subject.id, subject.name])
            );

            const requirementMap = new Map(
                requirements.map((requirement) => [
                    requirement.id,
                    requirement,
                ])
            );

            const grades: AcademicGrade[] = gradeRows.map((grade) => {
                const requirement = grade.requirement_id
                    ? requirementMap.get(grade.requirement_id)
                    : undefined;

                return {
                    ...grade,
                    subject_name:
                        subjectMap.get(grade.subject_id) ??
                        "Subject unavailable",
                    requirement_name:
                        requirement?.name ?? "Requirement unavailable",
                    requirement_type:
                        requirement?.requirement_type ?? "Not specified",
                };
            });

            setData({
                student,
                subjects,
                grades,
                attendance,
            });
        } catch (err) {
            console.error("Academic records error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your academic records."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    const attendanceCounts = (data?.attendance ?? []).reduce<
        Record<string, number>
    >((counts, record) => {
        const status = record.status?.trim() || "Unspecified";
        counts[status] = (counts[status] ?? 0) + 1;
        return counts;
    }, {});

    const exportRecords = () => {
        if (!data || exporting) return;

        setExporting(true);

        try {
            const { student, subjects, grades, attendance } = data;

            const rows: unknown[][] = [
                ["LEARNERSKIT - ACADEMIC RECORDS"],
                ["Exported on", new Date().toLocaleString("en-PH")],
                [],
                ["STUDENT INFORMATION"],
                ["Student number", student.student_number],
                [
                    "Full name",
                    `${student.first_name} ${student.last_name}`.trim(),
                ],
                ["Email", student.email],
                ["Gender", student.gender],
                ["Department", student.department],
                ["Academic program", student.academic_program],
                ["Year level", student.year_level],
                [],
                ["ENROLLED SUBJECTS"],
                ["Subject code", "Subject name"],
                ...subjects.map((subject) => [
                    subject.code || "",
                    subject.name,
                ]),
                [],
                ["GRADE RECORDS"],
                [
                    "Subject",
                    "Requirement",
                    "Requirement type",
                    "Semester",
                    "Grading period",
                    "Grade",
                    "Remarks",
                    "Recorded on",
                ],
                ...grades.map((grade) => [
                    grade.subject_name,
                    grade.requirement_name,
                    grade.requirement_type,
                    grade.semester,
                    grade.grading_period,
                    grade.grade,
                    grade.remarks,
                    formatDate(grade.created_at),
                ]),
                [],
                ["ATTENDANCE SUMMARY"],
                ["Status", "Number of records"],
                ...Object.entries(attendanceCounts),
                ["Total attendance records", attendance.length],
            ];

            const safeStudentNumber = (
                student.student_number || "student"
            ).replace(/[^a-zA-Z0-9_-]/g, "_");

            downloadCsv(
                `LearnersKit_Academic_Records_${safeStudentNumber}.csv`,
                rows
            );
        } catch (err) {
            console.error("Academic records export error:", err);
            window.alert("Unable to export your academic records.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-full min-h-0 w-full items-center justify-center overflow-y-auto p-4">
                <div className="w-full max-w-lg rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm dark:bg-[var(--card)] sm:p-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                        <AlertCircle size={25} />
                    </div>

                    <h1 className="mt-4 text-center text-xl font-bold text-foreground">
                        Unable to load academic records
                    </h1>

                    <p className="mt-2 text-center text-sm leading-6 text-foreground/60">
                        {error || "Please try again."}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadRecords()}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <RefreshCw size={17} />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const { student, subjects, grades, attendance } = data;

    const fullName =
        `${student.first_name} ${student.last_name}`.trim();

    const presentCount = attendance.filter(
        (record) => record.status?.trim().toLowerCase() === "present"
    ).length;

    const attendanceRate =
        attendance.length > 0
            ? Math.round((presentCount / attendance.length) * 100)
            : 0;

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 hide-scrollbar sm:gap-6 sm:p-6">
            {/* Page header */}
            <header className="flex min-w-0 flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <FileSpreadsheet size={22} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Academic Records
                        </h1>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/60 sm:text-base">
                        View your student information, enrolled subjects,
                        grades, and attendance in one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={exportRecords}
                    disabled={exporting}
                    className="cursor-pointer inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition 
                        hover:bg-[#24232E] transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    <Download size={18} />
                    {exporting ? "Preparing export..." : "Export Records"}
                </button>
            </header>

            {/* Export notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-[var(--accent)]/50 p-4 dark:bg-foreground/5">
                <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-[var(--primary)]"
                />
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Your academic information
                    </p>
                    <p className="mt-1 text-sm leading-5 text-foreground/60">
                        Export a spreadsheet-compatible CSV containing your
                        profile, enrolled subjects, available grade details,
                        and attendance summary.
                    </p>
                </div>
            </div>

            {/* Summary cards */}
            <section
                aria-label="Academic records summary"
                className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
                <SummaryCard
                    title="Enrolled Subjects"
                    value={numberFormatter.format(subjects.length)}
                    description="Subjects linked to your student record"
                    icon={BookOpen}
                />

                <SummaryCard
                    title="Grade Records"
                    value={numberFormatter.format(grades.length)}
                    description="Academic assessments recorded for you"
                    icon={GraduationCap}
                />

                <SummaryCard
                    title="Attendance Records"
                    value={numberFormatter.format(attendance.length)}
                    description="Attendance entries recorded for you"
                    icon={CalendarCheck}
                />
            </section>

            {/* Student information */}
            <section className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <SectionHeading
                    icon={UserRound}
                    title="Student Information"
                    description="Your registered personal and academic details."
                />

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-foreground/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                        ["Full name", fullName],
                        ["Student number", student.student_number],
                        ["Email address", student.email],
                        ["Gender", student.gender],
                        ["Department", student.department],
                        ["Academic program", student.academic_program],
                        ["Year level", student.year_level],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="min-w-0 rounded-xl bg-foreground/[0.025] p-4 dark:bg-foreground/[0.04]"
                        >
                            <p className="text-sm text-foreground/50">
                                {label}
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-foreground">
                                {value || "Not provided"}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Enrolled subjects */}
            <section className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <SectionHeading
                    icon={BookOpen}
                    title="Enrolled Subjects"
                    description="Subjects currently linked to your student record."
                />

                <div className="mt-5">
                    {subjects.length === 0 ? (
                        <EmptyState message="No enrolled subjects were found." />
                    ) : (
                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {subjects.map((subject) => (
                                <article
                                    key={subject.id}
                                    className="flex min-w-0 items-start gap-3 rounded-xl border border-foreground/10 p-4"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words text-sm font-semibold text-foreground">
                                            {subject.name}
                                        </h3>
                                        <p className="mt-1 break-words text-sm text-foreground/55">
                                            {subject.code || "No subject code"}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Grade records */}
            <section className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <SectionHeading
                    icon={GraduationCap}
                    title="Grade Records"
                    description="Your recorded assessment grades, periods, and educator remarks."
                />

                <div className="mt-5">
                    {grades.length === 0 ? (
                        <EmptyState message="No grade records are available yet. Your grades will appear here when your educator records them." />
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-foreground/10">
                            <table className="w-full min-w-[850px] border-collapse text-left">
                                <thead>
                                    <tr className="bg-foreground/[0.03] dark:bg-foreground/[0.05]">
                                        {[
                                            "Subject",
                                            "Requirement",
                                            "Semester",
                                            "Grading period",
                                            "Grade",
                                            "Remarks",
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-4 py-3 text-sm font-semibold text-foreground/65"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((grade) => (
                                        <tr
                                            key={grade.id}
                                            className="border-t border-foreground/10"
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-foreground">
                                                {grade.subject_name}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-foreground">
                                                    {grade.requirement_name}
                                                </p>
                                                <p className="mt-1 text-sm text-foreground/50">
                                                    {grade.requirement_type}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground/70">
                                                {grade.semester || "—"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground/70">
                                                {grade.grading_period || "—"}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-lg bg-[var(--primary)]/15 px-3 py-1.5 text-sm font-semibold text-foreground">
                                                    {grade.grade ?? "Not graded"}
                                                </span>
                                            </td>
                                            <td className="max-w-56 whitespace-normal break-words px-4 py-4 text-sm text-foreground/65">
                                                {grade.remarks || "No remarks"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Attendance */}
            <section className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <SectionHeading
                    icon={CalendarCheck}
                    title="Attendance Summary"
                    description="A summary of the attendance entries recorded for you."
                />

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-foreground/10 p-4">
                        <p className="text-sm text-foreground/55">
                            Total attendance entries
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {numberFormatter.format(attendance.length)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-foreground/10 p-4">
                        <p className="text-sm text-foreground/55">
                            Recorded present rate
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {attendance.length > 0 ? `${attendanceRate}%` : "—"}
                        </p>
                        <p className="mt-1 text-sm text-foreground/50">
                            Based on entries marked Present
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    {attendance.length === 0 ? (
                        <EmptyState message="No attendance entries are available yet." />
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(attendanceCounts).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 p-4"
                                    >
                                        <span className="break-words text-sm font-medium text-foreground">
                                            {status}
                                        </span>
                                        <span className="shrink-0 rounded-lg bg-[var(--primary)]/15 px-3 py-1.5 text-sm font-semibold text-foreground">
                                            {numberFormatter.format(count)}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer note */}
            <section className="rounded-2xl border border-foreground/10 bg-white p-5 dark:bg-[var(--card)] sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <ClipboardList size={21} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Keep your academic records up to date
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-foreground/60">
                            Review your records regularly. If your personal
                            information, grades, or attendance appear
                            incorrect, contact your school administrator or
                            educator.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
