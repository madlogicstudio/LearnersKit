
"use client";

import { useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    CalendarCheck,
    Search,
    RefreshCw,
    BookOpen,
    CheckCircle2,
    XCircle,
    Clock3,
    ClipboardList,
    ChevronDown,
    CalendarDays,
    X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
    admin_id: string | null;
    role: string;
};

type StudentRecord = {
    id: string;
};

type EnrollmentRecord = {
    subject_id: string;
};

type SubjectRecord = {
    id: string;
    name: string;
    code: string | null;
};

type AttendanceRecord = {
    id: string;
    student_id: string;
    subject_id: string;
    attendance_date: string;
    status: string | null;
    remarks: string | null;
};

type AttendanceStatus =
    | "present"
    | "absent"
    | "late"
    | "excused"
    | "other";

type SubjectAttendance = {
    subject: SubjectRecord;
    records: AttendanceRecord[];
    present: number;
    absent: number;
    late: number;
    excused: number;
    other: number;
    total: number;
    rate: number;
};

const STATUS_STYLES: Record<
    AttendanceStatus,
    { label: string; className: string }
> = {
    present: {
        label: "Present",
        className:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    absent: {
        label: "Absent",
        className: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    late: {
        label: "Late",
        className:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    excused: {
        label: "Excused",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    other: {
        label: "Unspecified",
        className: "bg-foreground/5 text-foreground/60",
    },
};

function normalizeStatus(status: string | null): AttendanceStatus {
    const value = status?.trim().toLowerCase() ?? "";

    if (value === "present") return "present";
    if (value === "absent") return "absent";
    if (value === "late") return "late";
    if (value === "excused") return "excused";

    return "other";
}

function formatDate(date: string) {
    const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatPercentage(value: number) {
    return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: string;
    description: string;
    icon: typeof CalendarCheck;
}) {
    return (
        <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[var(--card)]">
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
                    <Icon size={22} strokeWidth={1.8} />
                </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-foreground/50">
                {description}
            </p>
        </article>
    );
}

export default function Attendance() {
    const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedSubjectDetails, setSelectedSubjectDetails] =
    useState<SubjectAttendance | null>(null);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchAttendance() {
            setLoading(true);
            setError("");

            try {
                // 1. Verify the authenticated student.
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    window.location.replace("/login");
                    return;
                }

                // 2. Load the student's profile and administrator link.
                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("admin_id, role")
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
                        "Your account is not linked to a school administrator yet. Please complete the claim-code step."
                    );
                }

                // 3. Find this student's school record.
                const { data: studentData, error: studentError } =
                    await supabase
                        .from("students")
                        .select("id")
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

                // 4. Load the student's enrolled subjects.
                const { data: enrollmentData, error: enrollmentError } =
                    await supabase
                        .from("student_subjects")
                        .select("subject_id")
                        .eq("admin_id", profile.admin_id)
                        .eq("student_id", student.id);

                if (enrollmentError) throw enrollmentError;

                const subjectIds = [
                    ...new Set(
                        ((enrollmentData ?? []) as EnrollmentRecord[]).map(
                            (item) => item.subject_id
                        )
                    ),
                ];

                if (subjectIds.length === 0) {
                    if (!cancelled) {
                        setSubjects([]);
                        setAttendance([]);
                    }

                    return;
                }

                // 5. Fetch only the student's enrolled subjects.
                const { data: subjectData, error: subjectError } =
                    await supabase
                        .from("subjects")
                        .select("id, name, code")
                        .eq("admin_id", profile.admin_id)
                        .in("id", subjectIds)
                        .order("name", { ascending: true });

                if (subjectError) throw subjectError;

                const loadedSubjects =
                    (subjectData ?? []) as SubjectRecord[];

                // Use the actual subjects returned by the database.
                const loadedSubjectIds = loadedSubjects.map(
                    (subject) => subject.id
                );

                // 6. Fetch this student's attendance for those subjects.
                let loadedAttendance: AttendanceRecord[] = [];

                if (loadedSubjectIds.length > 0) {
                    const { data: attendanceData, error: attendanceError } =
                        await supabase
                            .from("attendance")
                            .select(
                                "id, student_id, subject_id, attendance_date, status, remarks"
                            )
                            .eq("admin_id", profile.admin_id)
                            .eq("student_id", student.id)
                            .in("subject_id", loadedSubjectIds)
                            .order("attendance_date", {
                                ascending: false,
                            });

                    if (attendanceError) throw attendanceError;

                    loadedAttendance =
                        (attendanceData ?? []) as AttendanceRecord[];
                }

                if (!cancelled) {
                    setSubjects(loadedSubjects);
                    setAttendance(loadedAttendance);
                }
            } catch (err) {
                console.error("Student attendance error:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load your attendance records."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchAttendance();

        return () => {
            cancelled = true;
        };
    }, []);

    // Group attendance records by subject.
    const subjectAttendance = useMemo<SubjectAttendance[]>(() => {
        return subjects.map((subject) => {
            const records = attendance
                .filter((record) => record.subject_id === subject.id)
                .sort((a, b) =>
                    b.attendance_date.localeCompare(a.attendance_date)
                );

            const counts = {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                other: 0,
            };

            records.forEach((record) => {
                counts[normalizeStatus(record.status)] += 1;
            });

            const total = records.length;

            // Present and late both count as attended sessions.
            const rate =
                total > 0
                    ? ((counts.present + counts.late) / total) * 100
                    : 0;

            return {
                subject,
                records,
                ...counts,
                total,
                rate,
            };
        });
    }, [subjects, attendance]);

    const totals = useMemo(() => {
        const result = {
            subjects: subjects.length,
            records: attendance.length,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            other: 0,
        };

        attendance.forEach((record) => {
            result[normalizeStatus(record.status)] += 1;
        });

        return result;
    }, [subjects, attendance]);

    const overallRate =
        totals.records > 0
            ? ((totals.present + totals.late) / totals.records) * 100
            : 0;

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return subjectAttendance.flatMap((item) =>
            item.records
                .filter((record) => {
                    const matchesSubject =
                        selectedSubject === "all" ||
                        record.subject_id === selectedSubject;

                    const matchesStatus =
                        selectedStatus === "all" ||
                        normalizeStatus(record.status) === selectedStatus;

                    const matchesSearch =
                        !query ||
                        item.subject.name.toLowerCase().includes(query) ||
                        (item.subject.code ?? "")
                            .toLowerCase()
                            .includes(query) ||
                        (record.remarks ?? "")
                            .toLowerCase()
                            .includes(query) ||
                        (record.status ?? "")
                            .toLowerCase()
                            .includes(query) ||
                        record.attendance_date.includes(query);

                    return (
                        matchesSubject &&
                        matchesStatus &&
                        matchesSearch
                    );
                })
                .map((record) => ({
                    ...record,
                    subject: item.subject,
                }))
        ).sort((a, b) =>
            b.attendance_date.localeCompare(a.attendance_date)
        );
    }, [subjectAttendance, search, selectedSubject, selectedStatus]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 hide-scrollbar sm:gap-6 sm:p-6">
            {/* Page header */}
            <header className="flex min-w-0 flex-col gap-2 px-1 sm:px-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <CalendarCheck size={23} />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            My Attendance
                        </h1>

                        <p className="mt-1 text-sm leading-6 text-foreground/55 sm:text-base">
                            Track your attendance and review records for each
                            subject.
                        </p>
                    </div>
                </div>
            </header>

            {/* Summary cards */}
            <section
                aria-label="Attendance summary"
                className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                <SummaryCard
                    title="Enrolled Subjects"
                    value={loading ? "..." : String(totals.subjects)}
                    description="Subjects assigned to your student record"
                    icon={BookOpen}
                />

                <SummaryCard
                    title="Attendance Records"
                    value={loading ? "..." : String(totals.records)}
                    description="Total recorded attendance sessions"
                    icon={ClipboardList}
                />

                <SummaryCard
                    title="Present"
                    value={loading ? "..." : String(totals.present)}
                    description="Sessions marked present"
                    icon={CheckCircle2}
                />

                <SummaryCard
                    title="Overall Attendance"
                    value={
                        loading
                            ? "..."
                            : totals.records > 0
                              ? formatPercentage(overallRate)
                              : "—"
                    }
                    description="Present and late sessions divided by all recorded sessions"
                    icon={CalendarCheck}
                />
            </section>

            {/* Subject attendance breakdown */}
            <section className="flex flex-col gap-4">
                <div className="px-1 sm:px-2">
                    <h2 className="text-lg font-bold text-foreground">
                        Attendance by Subject
                    </h2>

                    <p className="mt-1 text-sm text-foreground/55">
                        View your attendance rate and recorded sessions for
                        each subject.
                    </p>
                </div>

                {loading ? (
                    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-white p-8 dark:bg-[var(--card)]">
                        <RefreshCw
                            size={24}
                            className="animate-spin text-[var(--primary)]"
                        />
                        <p className="text-sm text-foreground/55">
                            Loading attendance...
                        </p>
                    </div>
                ) : error ? (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-500/20 bg-white p-6 text-sm text-red-600 dark:bg-[var(--card)] dark:text-red-400"
                    >
                        <p className="font-semibold">
                            Unable to load attendance
                        </p>
                        <p className="mt-2 leading-6">{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5"
                        >
                            Try again
                        </button>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-10 text-center shadow-sm dark:bg-[var(--card)]">
                        <BookOpen
                            size={28}
                            className="mx-auto text-[var(--primary)]"
                        />
                        <h3 className="mt-3 font-semibold text-foreground">
                            No subjects assigned yet
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-foreground/55">
                            Your attendance will appear here once your school
                            administrator enrolls you in subjects.
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        
                        {subjectAttendance.map((item) => (
                            <button
                                key={item.subject.id}
                                type="button"
                                onClick={() => setSelectedSubjectDetails(item)}
                                className="group min-w-0 w-full rounded-2xl border border-foreground/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] dark:bg-[var(--card)]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                        <BookOpen size={22} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="break-words font-semibold text-foreground">
                                            {item.subject.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-foreground/55">
                                            {item.subject.code || "No subject code"}
                                        </p>
                                    </div>

                                    
                                </div>

                                <div className="mt-5 border-t border-foreground/10 pt-4">
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-foreground/55">
                                                Attendance rate
                                            </p>
                                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                                {item.total > 0
                                                    ? formatPercentage(item.rate)
                                                    : "—"}
                                            </p>
                                        </div>

                                        <span className="text-xs text-foreground/50">
                                            {item.total}{" "}
                                            {item.total === 1 ? "record" : "records"}
                                        </span>
                                    </div>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
                                        <div
                                            className="h-full rounded-full bg-[var(--primary)] transition-all"
                                            style={{ width: `${item.rate}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-emerald-500/5 p-3">
                                        <p className="text-sm text-foreground/55">Present</p>
                                        <p className="mt-1 text-md font-semibold text-emerald-700 dark:text-emerald-400">
                                            {item.present}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-red-500/5 p-3">
                                        <p className="text-sm text-foreground/55">Absent</p>
                                        <p className="mt-1 text-md font-semibold text-red-600 dark:text-red-400">
                                            {item.absent}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-amber-500/5 p-3">
                                        <p className="text-sm text-foreground/55">Late</p>
                                        <p className="mt-1 text-md font-semibold text-amber-700 dark:text-amber-400">
                                            {item.late}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-blue-500/5 p-3">
                                        <p className="text-sm text-foreground/55">Excused</p>
                                        <p className="mt-1 text-md font-semibold text-blue-700 dark:text-blue-400">
                                            {item.excused}
                                        </p>
                                    </div>
                                </div>

                                <div className="cursor-pointer mt-4 flex items-center justify-center gap-2 border-t border-foreground/10 pt-4 text-sm font-medium text-[var(--primary)]">
                                    <ClipboardList size={16} />
                                    View full attendance history
                                </div>
                            </button>
                        ))}

                    </div>
                )}
            </section>

            {/* Attendance modal */}
            
            {selectedSubjectDetails && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
                    onClick={() => setSelectedSubjectDetails(null)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="attendance-modal-title"
                        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-2xl dark:bg-[var(--card)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-5 sm:p-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                    <CalendarCheck size={23} />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="attendance-modal-title"
                                        className="break-words text-lg font-bold text-foreground sm:text-xl"
                                    >
                                        {selectedSubjectDetails.subject.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-foreground/55">
                                        {selectedSubjectDetails.subject.code ||
                                            "No subject code"}
                                        {" · "}
                                        Full attendance history
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedSubjectDetails(null)}
                                aria-label="Close attendance history"
                                className="bg-[var(--primary)]/80 transition cursor-pointer text-white items-center gap-3 rounded-lg p-2 hover:bg-[#24232E] disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Attendance summary */}
                        <div className="grid grid-cols-2 gap-3 border-b border-foreground/10 p-5 sm:grid-cols-4 sm:p-6">
                            <div className="rounded-xl bg-foreground/[0.03] p-3">
                                <p className="text-sm text-foreground/55">
                                    Total records
                                </p>
                                <p className="mt-2 text-2xl font-bold text-foreground">
                                    {selectedSubjectDetails.total}
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-500/5 p-3">
                                <p className="text-sm text-foreground/55">Present</p>
                                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {selectedSubjectDetails.present}
                                </p>
                            </div>

                            <div className="rounded-xl bg-red-500/5 p-3">
                                <p className="text-sm text-foreground/55">Absent</p>
                                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                                    {selectedSubjectDetails.absent}
                                </p>
                            </div>

                            <div className="rounded-xl bg-[var(--primary)]/10 p-3">
                                <p className="text-sm text-foreground/55">
                                    Attendance rate
                                </p>
                                <p className="mt-2 text-2xl font-bold text-[var(--primary)]">
                                    {selectedSubjectDetails.total > 0
                                        ? formatPercentage(
                                            selectedSubjectDetails.rate
                                        )
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Full attendance table */}
                        <div className="min-h-0 flex-1 overflow-auto">
                            {selectedSubjectDetails.records.length === 0 ? (
                                <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
                                    <CalendarDays
                                        size={32}
                                        className="text-foreground/35"
                                    />
                                    <h3 className="mt-3 font-semibold text-foreground">
                                        No attendance records yet
                                    </h3>
                                    <p className="mt-1 text-sm text-foreground/55">
                                        Attendance for this subject will appear here
                                        once your educator records it.
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full min-w-[600px] text-left">
                                    <thead className="sticky top-0 z-10 bg-foreground/[0.03]">
                                        <tr className="border-b border-foreground/10">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                #
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Attendance date
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Status
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Remarks
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selectedSubjectDetails.records.map(
                                            (record, index) => {
                                                const status = normalizeStatus(
                                                    record.status
                                                );
                                                const style = STATUS_STYLES[status];

                                                return (
                                                    <tr
                                                        key={record.id}
                                                        className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02]"
                                                    >
                                                        <td className="px-5 py-4 text-sm text-foreground/45">
                                                            {index + 1}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-foreground">
                                                            {formatDate(
                                                                record.attendance_date
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${style.className}`}
                                                            >
                                                                {style.label}
                                                            </span>
                                                        </td>

                                                        <td className="max-w-xs px-5 py-4 text-sm text-foreground/60">
                                                            <span className="block break-words">
                                                                {record.remarks || "—"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 bg-foreground/[0.02] px-5 py-4 sm:px-6">
                            <p className="text-sm text-foreground/50">
                                {selectedSubjectDetails.records.length} attendance{" "}
                                {selectedSubjectDetails.records.length === 1
                                    ? "record"
                                    : "records"}
                            </p>

                            
                        </div>
                    </section>
                </div>
            )}


            {/* Attendance history */}
            <section className="flex flex-col gap-4">
                <div className="px-1 sm:px-2">
                    <h2 className="text-lg font-bold text-foreground">
                        Attendance History
                    </h2>
                    <p className="mt-1 text-sm text-foreground/55">
                        Review individual attendance entries across your
                        subjects.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] md:grid-cols-3">
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search subject or remarks..."
                            aria-label="Search attendance history"
                            className="w-full rounded-xl border border-foreground/15 bg-white py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 dark:bg-[var(--card)]"
                        />
                    </div>

                    <div className="relative min-w-0">
                        <BookOpen
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <select
                            value={selectedSubject}
                            onChange={(event) =>
                                setSelectedSubject(event.target.value)
                            }
                            aria-label="Filter by subject"
                            className="w-full appearance-none rounded-xl border border-foreground/15 bg-white py-2.5 pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 dark:bg-[var(--card)]"
                        >
                            <option value="all">All subjects</option>
                            {subjects.map((subject) => (
                                <option
                                    key={subject.id}
                                    value={subject.id}
                                >
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45"
                        />
                    </div>

                    <div className="relative min-w-0">
                        <ClipboardList
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <select
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value)
                            }
                            aria-label="Filter by attendance status"
                            className="w-full appearance-none rounded-xl border border-foreground/15 bg-white py-2.5 pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 dark:bg-[var(--card)]"
                        >
                            <option value="all">All statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                            <option value="other">Unspecified</option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-foreground/10 bg-white p-6 dark:bg-[var(--card)]">
                        <p className="text-sm text-foreground/55">
                            Loading attendance history...
                        </p>
                    </div>
                ) : !error && filteredRecords.length === 0 ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-10 text-center shadow-sm dark:bg-[var(--card)]">
                        <CalendarDays
                            size={28}
                            className="mx-auto text-foreground/35"
                        />
                        <h3 className="mt-3 font-semibold text-foreground">
                            No attendance records found
                        </h3>
                        <p className="mt-1 text-sm text-foreground/55">
                            {attendance.length === 0
                                ? "Your attendance entries will appear here once your educators record them."
                                : "Try changing your search or filters."}
                        </p>
                    </div>
                ) : !error ? (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-sm dark:bg-[var(--card)] md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left">
                                    <thead className="bg-foreground/[0.03]">
                                        <tr className="border-b border-foreground/10">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Subject
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Date
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Status
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                                Remarks
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRecords.map((record) => {
                                            const status = normalizeStatus(
                                                record.status
                                            );
                                            const style =
                                                STATUS_STYLES[status];

                                            return (
                                                <tr
                                                    key={record.id}
                                                    className="border-b border-foreground/5 last:border-b-0 transition hover:bg-foreground/[0.02]"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {record.subject.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-foreground/50">
                                                            {record.subject.code ||
                                                                "No subject code"}
                                                        </p>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-foreground/70">
                                                        {formatDate(
                                                            record.attendance_date
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${style.className}`}
                                                        >
                                                            {style.label}
                                                        </span>
                                                    </td>

                                                    <td className="max-w-64 px-5 py-4 text-sm text-foreground/60">
                                                        <span className="block break-words">
                                                            {record.remarks ||
                                                                "—"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-foreground/10 px-5 py-3">
                                <p className="text-xs text-foreground/50">
                                    Showing {filteredRecords.length} of{" "}
                                    {attendance.length} attendance records
                                </p>
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {filteredRecords.map((record) => {
                                const status = normalizeStatus(record.status);
                                const style = STATUS_STYLES[status];

                                return (
                                    <article
                                        key={record.id}
                                        className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                                <BookOpen size={20} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="break-words text-sm font-semibold text-foreground">
                                                    {record.subject.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-foreground/50">
                                                    {record.subject.code ||
                                                        "No subject code"}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                                            >
                                                {style.label}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 border-t border-foreground/10 pt-3 text-sm text-foreground/60">
                                            <CalendarDays
                                                size={16}
                                                className="shrink-0"
                                            />
                                            {formatDate(
                                                record.attendance_date
                                            )}
                                        </div>

                                        {record.remarks && (
                                            <p className="mt-3 break-words text-sm leading-5 text-foreground/55">
                                                {record.remarks}
                                            </p>
                                        )}
                                    </article>
                                );
                            })}

                            <p className="px-1 text-xs text-foreground/45">
                                Showing {filteredRecords.length} of{" "}
                                {attendance.length} attendance records
                            </p>
                        </div>
                    </>
                ) : null}
            </section>

            {/* Reminder */}
            <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Clock3 size={21} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground">
                            Stay on track
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-foreground/60">
                            Review your attendance regularly. If you notice an
                            incorrect date or status, contact your educator or
                            school administrator to have your record checked.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
