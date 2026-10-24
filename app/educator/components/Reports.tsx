"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    Activity,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Download,
    FileSpreadsheet,
    GraduationCap,
    LoaderCircle,
    Printer,
    Search,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import { createClient } from "@/lib/supabase/client";

type ReportType = "overview" | "attendance" | "grades";
type AttendanceStatus = "present" | "absent" | "late" | "excused";

type Student = {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string | null;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type Subject = {
    id: string;
    name: string;
    code: string | null;
};

type AttendanceRecord = {
    id: string;
    student_id: string;
    subject_id: string;
    attendance_date: string;
    status: AttendanceStatus;
    remarks: string | null;
};

type GradeRecord = {
    id?: string;
    student_id: string;
    subject_id: string;
    grade: number | string;
    semester: string;
    grading_period: string;
    requirement_id: string;
    remarks: string | null;
};

type Profile = {
    id: string;
    role: string;
    admin_id: string | null;
};

const REPORT_TYPES: {
    value: ReportType;
    label: string;
    description: string;
    icon: ReactNode;
}[] = [
    {
        value: "overview",
        label: "Overview",
        description: "View your academic records at a glance.",
        icon: <Activity size={18} />,
    },
    {
        value: "attendance",
        label: "Attendance",
        description: "Review attendance records and student participation.",
        icon: <CalendarDays size={18} />,
    },
    {
        value: "grades",
        label: "Grades",
        description: "Review student grades by subject and grading period.",
        icon: <GraduationCap size={18} />,
    },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
    present: "bg-emerald-500/10 text-emerald-600",
    absent: "bg-red-500/10 text-red-500",
    late: "bg-amber-500/10 text-amber-600",
    excused: "bg-violet-500/10 text-violet-600",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    excused: "Excused",
};

function getLocalDate() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

function getMonthStart() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getStudentName(student?: Student) {
    if (!student) return "Unknown student";
    return `${student.first_name} ${student.last_name}`;
}

function formatDate(date: string) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatPercent(value: number) {
    return `${value.toFixed(1)}%`;
}

function escapeCSV(value: unknown) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(filename: string, rows: unknown[][]) {
    const csv = rows
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

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

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
    const supabase = useMemo(() => createClient(), []);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [educatorId, setEducatorId] = useState("");
    const [adminId, setAdminId] = useState("");

    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [grades, setGrades] = useState<GradeRecord[]>([]);

    const [reportType, setReportType] = useState<ReportType>("overview");
    const [selectedSubject, setSelectedSubject] = useState("all");
    const [startDate, setStartDate] = useState(getMonthStart());
    const [endDate, setEndDate] = useState(getLocalDate());
    const [selectedPeriod, setSelectedPeriod] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadReports = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setNotice("");

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    throw new Error("Please sign in to access reports.");
                }

                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("id, role, admin_id")
                        .eq("id", user.id)
                        .single();

                if (profileError) throw profileError;

                const profile = profileData as Profile;

                if (profile.role !== "educator") {
                    throw new Error(
                        "Only educator accounts can access these reports."
                    );
                }

                if (!profile.admin_id) {
                    throw new Error(
                        "Your educator account is not linked to an administrator."
                    );
                }

                setEducatorId(user.id);
                setAdminId(profile.admin_id);

                const [
                    studentsResult,
                    subjectsResult,
                    attendanceResult,
                    gradesResult,
                ] = await Promise.all([
                    supabase
                        .from("students")
                        .select(
                            "id, student_number, first_name, last_name, email, department, academic_program, year_level"
                        )
                        .eq("admin_id", profile.admin_id)
                        .order("last_name", { ascending: true }),

                    supabase
                        .from("subjects")
                        .select("id, name, code")
                        .eq("admin_id", profile.admin_id)
                        .order("name", { ascending: true }),

                    supabase
                        .from("attendance")
                        .select(
                            "id, student_id, subject_id, attendance_date, status, remarks"
                        )
                        .eq("admin_id", profile.admin_id)
                        .eq("educator_id", user.id)
                        .order("attendance_date", { ascending: false }),

                    supabase
                        .from("grades")
                        .select(
                            "student_id, subject_id, grade, semester, grading_period, requirement_id, remarks"
                        )
                        .eq("admin_id", profile.admin_id)
                        .eq("educator_id", user.id),
                ]);

                if (studentsResult.error) throw studentsResult.error;
                if (subjectsResult.error) throw subjectsResult.error;
                if (attendanceResult.error) throw attendanceResult.error;
                if (gradesResult.error) throw gradesResult.error;

                setStudents((studentsResult.data ?? []) as Student[]);
                setSubjects((subjectsResult.data ?? []) as Subject[]);
                setAttendance(
                    (attendanceResult.data ?? []) as AttendanceRecord[]
                );
                setGrades((gradesResult.data ?? []) as GradeRecord[]);
            } catch (err) {
                console.error("Failed to load reports:", err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load reports."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [supabase]
    );

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    const studentMap = useMemo(
        () => new Map(students.map((student) => [student.id, student])),
        [students]
    );

    const subjectMap = useMemo(
        () => new Map(subjects.map((subject) => [subject.id, subject])),
        [subjects]
    );

    const filteredAttendance = useMemo(() => {
        return attendance.filter((record) => {
            const matchesSubject =
                selectedSubject === "all" ||
                record.subject_id === selectedSubject;

            const matchesStart =
                !startDate || record.attendance_date >= startDate;

            const matchesEnd = !endDate || record.attendance_date <= endDate;

            const student = studentMap.get(record.student_id);
            const query = searchQuery.trim().toLowerCase();

            const matchesSearch =
                !query ||
                [
                    student?.student_number ?? "",
                    student?.first_name ?? "",
                    student?.last_name ?? "",
                    student?.email ?? "",
                    student?.academic_program ?? "",
                ].some((value) => value.toLowerCase().includes(query));

            return (
                matchesSubject &&
                matchesStart &&
                matchesEnd &&
                matchesSearch
            );
        });
    }, [
        attendance,
        selectedSubject,
        startDate,
        endDate,
        searchQuery,
        studentMap,
    ]);

    const filteredGrades = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return grades.filter((record) => {
            const matchesSubject =
                selectedSubject === "all" ||
                record.subject_id === selectedSubject;

            const matchesPeriod =
                selectedPeriod === "all" ||
                record.grading_period === selectedPeriod;

            const student = studentMap.get(record.student_id);

            const matchesSearch =
                !query ||
                [
                    student?.student_number ?? "",
                    student?.first_name ?? "",
                    student?.last_name ?? "",
                    student?.email ?? "",
                    student?.academic_program ?? "",
                ].some((value) => value.toLowerCase().includes(query));

            return matchesSubject && matchesPeriod && matchesSearch;
        });
    }, [
        grades,
        selectedSubject,
        selectedPeriod,
        searchQuery,
        studentMap,
    ]);

    const attendanceSummary = useMemo(() => {
        const counts: Record<AttendanceStatus, number> = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
        };

        for (const record of filteredAttendance) {
            if (record.status in counts) {
                counts[record.status]++;
            }
        }

        const markedCount = Object.values(counts).reduce(
            (total, value) => total + value,
            0
        );

        const attendanceRate =
            markedCount > 0
                ? ((counts.present + counts.late) / markedCount) * 100
                : 0;

        return { ...counts, markedCount, attendanceRate };
    }, [filteredAttendance]);

    const gradeSummary = useMemo(() => {
        const values = filteredGrades
            .map((record) => Number(record.grade))
            .filter((value) => Number.isFinite(value));

        const average =
            values.length > 0
                ? values.reduce((total, value) => total + value, 0) /
                  values.length
                : 0;

        const highest = values.length > 0 ? Math.max(...values) : 0;
        const lowest = values.length > 0 ? Math.min(...values) : 0;

        return {
            count: values.length,
            average,
            highest,
            lowest,
        };
    }, [filteredGrades]);

    const overallStats = useMemo(() => {
        const distinctAttendanceStudents = new Set(
            filteredAttendance.map((record) => record.student_id)
        ).size;

        return {
            students: students.length,
            subjects: subjects.length,
            attendanceRecords: filteredAttendance.length,
            gradeRecords: filteredGrades.length,
            studentsWithAttendance: distinctAttendanceStudents,
        };
    }, [students, subjects, filteredAttendance, filteredGrades]);

    const handleExport = () => {
        setError("");
        setNotice("");

        if (reportType === "attendance") {
            if (filteredAttendance.length === 0) {
                setError("There are no attendance records to export.");
                return;
            }

            const rows: unknown[][] = [
                [
                    "Student Number",
                    "Student Name",
                    "Email",
                    "Department",
                    "Academic Program",
                    "Year Level",
                    "Subject",
                    "Date",
                    "Status",
                    "Remarks",
                ],
                ...filteredAttendance.map((record) => {
                    const student = studentMap.get(record.student_id);
                    const subject = subjectMap.get(record.subject_id);

                    return [
                        student?.student_number ?? "",
                        getStudentName(student),
                        student?.email ?? "",
                        student?.department ?? "",
                        student?.academic_program ?? "",
                        student?.year_level ?? "",
                        subject?.name ?? "",
                        record.attendance_date,
                        STATUS_LABELS[record.status] ?? record.status,
                        record.remarks ?? "",
                    ];
                }),
            ];

            downloadCSV(
                `learnerskit-attendance-${startDate}-to-${endDate}.csv`,
                rows
            );
            setNotice("Attendance report exported successfully.");
            return;
        }

        if (reportType === "grades") {
            if (filteredGrades.length === 0) {
                setError("There are no grade records to export.");
                return;
            }

            const rows: unknown[][] = [
                [
                    "Student Number",
                    "Student Name",
                    "Subject",
                    "Semester",
                    "Grading Period",
                    "Grade",
                    "Remarks",
                    "Requirement ID",
                ],
                ...filteredGrades.map((record) => {
                    const student = studentMap.get(record.student_id);
                    const subject = subjectMap.get(record.subject_id);

                    return [
                        student?.student_number ?? "",
                        getStudentName(student),
                        subject?.name ?? "",
                        record.semester,
                        record.grading_period,
                        record.grade,
                        record.remarks ?? "",
                        record.requirement_id,
                    ];
                }),
            ];

            downloadCSV("learnerskit-grades-report.csv", rows);
            setNotice("Grade report exported successfully.");
            return;
        }

        const rows: unknown[][] = [
            ["Report", "Value"],
            ["Total Students", students.length],
            ["Total Subjects", subjects.length],
            ["Attendance Records", filteredAttendance.length],
            ["Attendance Rate", formatPercent(attendanceSummary.attendanceRate)],
            ["Present", attendanceSummary.present],
            ["Absent", attendanceSummary.absent],
            ["Late", attendanceSummary.late],
            ["Excused", attendanceSummary.excused],
            ["Grade Records", filteredGrades.length],
            ["Grade Average", gradeSummary.average.toFixed(2)],
            ["Highest Grade", gradeSummary.highest.toFixed(2)],
            ["Lowest Grade", gradeSummary.lowest.toFixed(2)],
            ["Report Start Date", startDate],
            ["Report End Date", endDate],
        ];

        downloadCSV("learnerskit-academic-overview.csv", rows);
        setNotice("Overview report exported successfully.");
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3 sm:gap-6 sm:p-6 print:overflow-visible print:p-0 hide-scrollbar">
            {/* Header */}
            <header className="sm:mt-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Reports
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/60 sm:mt-3">
                        Review and export your students&apos; academic
                        performance and attendance records.
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 print:hidden sm:flex sm:w-auto sm:flex-wrap">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-foreground/20 bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-foreground/5 dark:bg-[var(--card)] sm:px-4"
                    >
                        <Printer size={17} className="shrink-0" />
                        Print
                    </button>

                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:px-4"
                    >
                        <Download size={17} className="shrink-0" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div
                    role="alert"
                    className="flex min-w-0 items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500 sm:p-4"
                >
                    <X size={18} className="mt-0.5 shrink-0" />
                    <p className="min-w-0 flex-1 break-words">{error}</p>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                        className="shrink-0 rounded-lg p-1 hover:bg-red-500/10"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="flex min-w-0 items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600 sm:items-center sm:p-4"
                >
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 sm:mt-0" />
                    <p className="min-w-0 break-words">{notice}</p>
                </div>
            )}

            {/* Report Type */}
            <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {REPORT_TYPES.map((report) => {
                    const active = reportType === report.value;

                    return (
                        <button
                            key={report.value}
                            type="button"
                            onClick={() => {
                                setReportType(report.value);
                                setSearchQuery("");
                                setError("");
                                setNotice("");
                            }}
                            className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition sm:p-5 ${
                                active
                                    ? "border-[var(--primary)] bg-white dark:bg-[var(--card)]"
                                    : "border-foreground/20 bg-white hover:bg-foreground/[0.025] dark:bg-[var(--card)]"
                            }`}
                        >
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    active
                                        ? "bg-[var(--primary)] text-white"
                                        : "bg-[#24232E] text-white"
                                }`}
                            >
                                {report.icon}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold">
                                    {report.label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-foreground/60">
                                    {report.description}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </section>

            {/* Filters */}
            <section className="min-w-0 rounded-2xl border border-foreground/20 bg-white p-3 dark:bg-[var(--card)] sm:p-5 print:hidden">
                <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardList
                            size={19}
                            className="shrink-0 text-[var(--primary)]"
                        />
                        <h2 className="font-semibold">Report Filters</h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadReports(true)}
                        disabled={refreshing}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-foreground/20 px-3 py-2 text-xs font-medium transition hover:bg-foreground/5 disabled:opacity-50 sm:w-auto"
                    >
                        <LoaderCircle
                            size={14}
                            className={refreshing ? "animate-spin" : "hidden"}
                        />
                        {refreshing ? "Refreshing..." : "Refresh data"}
                    </button>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <FilterSelect
                        id="report-subject"
                        label="Subject"
                        value={selectedSubject}
                        onChange={setSelectedSubject}
                        options={[
                            { value: "all", label: "All subjects" },
                            ...subjects.map((subject) => ({
                                value: subject.id,
                                label: subject.code
                                    ? `${subject.code} — ${subject.name}`
                                    : subject.name,
                            })),
                        ]}
                    />

                    {reportType !== "grades" ? (
                        <>
                            <FilterInput
                                id="report-start-date"
                                label="Start Date"
                                type="date"
                                value={startDate}
                                onChange={setStartDate}
                            />

                            <FilterInput
                                id="report-end-date"
                                label="End Date"
                                type="date"
                                value={endDate}
                                onChange={setEndDate}
                            />
                        </>
                    ) : (
                        <FilterSelect
                            id="report-period"
                            label="Grading Period"
                            value={selectedPeriod}
                            onChange={setSelectedPeriod}
                            options={[
                                { value: "all", label: "All periods" },
                                {
                                    value: "First Quarter",
                                    label: "First Quarter",
                                },
                                {
                                    value: "Second Quarter",
                                    label: "Second Quarter",
                                },
                                {
                                    value: "Third Quarter",
                                    label: "Third Quarter",
                                },
                                {
                                    value: "Fourth Quarter",
                                    label: "Fourth Quarter",
                                },
                            ]}
                        />
                    )}

                    <div className="flex min-w-0 flex-col gap-2">
                        <label
                            htmlFor="report-search"
                            className="text-sm font-medium text-foreground/70"
                        >
                            Search Student
                        </label>

                        <div className="relative min-w-0">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                            />
                            <input
                                id="report-search"
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Name or student number..."
                                className="w-full min-w-0 rounded-xl border border-foreground/20 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)] dark:bg-[var(--card)]"
                            />
                        </div>
                    </div>
                </div>

                {startDate &&
                    endDate &&
                    startDate > endDate &&
                    reportType !== "grades" && (
                        <p className="mt-3 text-xs text-red-500">
                            The start date must be before or equal to the end date.
                        </p>
                    )}
            </section>

            {/* Overview */}
            {reportType === "overview" && (
                <>
                    <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
                        <MetricCard
                            label="Total Students"
                            value={overallStats.students}
                            icon={<Users size={24} />}
                            description="Students in your institution"
                        />
                        <MetricCard
                            label="Subjects"
                            value={overallStats.subjects}
                            icon={<ClipboardList size={24} />}
                            description="Available subjects"
                        />
                        <MetricCard
                            label="Attendance Rate"
                            value={formatPercent(
                                attendanceSummary.attendanceRate
                            )}
                            icon={<CalendarDays size={24} />}
                            description={`${attendanceSummary.markedCount} attendance records in range`}
                        />
                        <MetricCard
                            label="Grade Average"
                            value={
                                gradeSummary.count
                                    ? gradeSummary.average.toFixed(2)
                                    : "—"
                            }
                            icon={<TrendingUp size={24} />}
                            description={`${gradeSummary.count} grade records`}
                        />
                    </section>

                    <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="min-w-0 rounded-2xl border border-foreground/20 bg-white p-3 dark:bg-[var(--card)] sm:p-5">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="font-semibold">
                                        Attendance Summary
                                    </h2>
                                    <p className="mt-1 break-words text-xs text-foreground/60">
                                        {formatDate(startDate)} – {formatDate(endDate)}
                                    </p>
                                </div>
                                <CalendarDays
                                    size={24}
                                    className="shrink-0 text-[var(--primary)]"
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <AttendanceBar
                                    label="Present"
                                    count={attendanceSummary.present}
                                    total={attendanceSummary.markedCount}
                                    color="bg-emerald-500"
                                />
                                <AttendanceBar
                                    label="Absent"
                                    count={attendanceSummary.absent}
                                    total={attendanceSummary.markedCount}
                                    color="bg-red-500"
                                />
                                <AttendanceBar
                                    label="Late"
                                    count={attendanceSummary.late}
                                    total={attendanceSummary.markedCount}
                                    color="bg-amber-500"
                                />
                                <AttendanceBar
                                    label="Excused"
                                    count={attendanceSummary.excused}
                                    total={attendanceSummary.markedCount}
                                    color="bg-violet-500"
                                />

                                {attendanceSummary.markedCount === 0 && (
                                    <EmptyState message="No attendance records were found for these filters." />
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 rounded-2xl border border-foreground/20 bg-white p-3 dark:bg-[var(--card)] sm:p-5">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="font-semibold">
                                        Grade Summary
                                    </h2>
                                    <p className="mt-1 text-xs text-foreground/60">
                                        Based on matching grade records
                                    </p>
                                </div>
                                <GraduationCap
                                    size={20}
                                    className="shrink-0 text-[var(--primary)]"
                                />
                            </div>

                            {gradeSummary.count === 0 ? (
                                <EmptyState message="No grade records were found for these filters." />
                            ) : (
                                <div className="grid min-w-0 grid-cols-2 gap-3">
                                    <SmallMetric
                                        label="Average Grade"
                                        value={gradeSummary.average.toFixed(2)}
                                    />
                                    <SmallMetric
                                        label="Grade Records"
                                        value={gradeSummary.count}
                                    />
                                    <SmallMetric
                                        label="Highest Grade"
                                        value={gradeSummary.highest.toFixed(2)}
                                    />
                                    <SmallMetric
                                        label="Lowest Grade"
                                        value={gradeSummary.lowest.toFixed(2)}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="min-w-0 overflow-hidden rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)]">
                        <div className="flex flex-col gap-1 border-b border-foreground/20 p-3 sm:p-5">
                            <h2 className="font-semibold">
                                Recent Attendance Records
                            </h2>
                            <p className="text-sm text-foreground/60">
                                Latest records matching your date, subject, and search filters.
                            </p>
                        </div>

                        {filteredAttendance.length === 0 ? (
                            <EmptyState message="No attendance records to display." />
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="w-full min-w-[650px] text-left">
                                        <thead>
                                            <tr className="border-b border-foreground/20 bg-foreground/[0.025]">
                                                <TableHeading>Student</TableHeading>
                                                <TableHeading>Subject</TableHeading>
                                                <TableHeading>Date</TableHeading>
                                                <TableHeading>Status</TableHeading>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttendance.slice(0, 8).map((record) => (
                                                <tr
                                                    key={record.id}
                                                    className="border-b border-foreground/10 last:border-0"
                                                >
                                                    <td className="px-4 py-4">
                                                        <p className="text-sm font-medium">
                                                            {getStudentName(
                                                                studentMap.get(record.student_id)
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-foreground/50">
                                                            {studentMap.get(record.student_id)?.student_number ?? "—"}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-foreground/70">
                                                        {formatDate(record.attendance_date)}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <StatusBadge status={record.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-3 p-3 lg:hidden">
                                    {filteredAttendance.slice(0, 8).map((record) => {
                                        const student = studentMap.get(record.student_id);

                                        return (
                                            <article
                                                key={record.id}
                                                className="flex min-w-0 flex-col gap-3 rounded-xl border border-foreground/15 p-3 sm:p-4"
                                            >
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="break-words font-semibold">
                                                            {getStudentName(student)}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-foreground/50">
                                                            {student?.student_number ?? "—"}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={record.status} />
                                                </div>

                                                <div className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Subject
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Date
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {formatDate(record.attendance_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}

            {/* Attendance Report */}
            {reportType === "attendance" && (
                <>
                    <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
                        <MetricCard
                            label="Records"
                            value={attendanceSummary.markedCount}
                            icon={<ClipboardList size={18} />}
                        />
                        <MetricCard
                            label="Present"
                            value={attendanceSummary.present}
                            color="text-emerald-600"
                        />
                        <MetricCard
                            label="Absent"
                            value={attendanceSummary.absent}
                            color="text-red-500"
                        />
                        <MetricCard
                            label="Late"
                            value={attendanceSummary.late}
                            color="text-amber-600"
                        />
                        <MetricCard
                            label="Attendance Rate"
                            value={formatPercent(attendanceSummary.attendanceRate)}
                            icon={<TrendingUp size={18} />}
                        />
                    </section>

                    <section className="min-w-0 rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)]">
                        <ReportSectionHeader
                            title="Attendance Report"
                            subtitle={`${filteredAttendance.length} records found`}
                        />

                        {filteredAttendance.length === 0 ? (
                            <EmptyState message="No attendance records match the selected filters." />
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto xl:block">
                                    <table className="w-full min-w-[850px] text-left">
                                        <thead>
                                            <tr className="border-b border-foreground/20 bg-foreground/[0.025]">
                                                <TableHeading>Student</TableHeading>
                                                <TableHeading>Program / Year</TableHeading>
                                                <TableHeading>Subject</TableHeading>
                                                <TableHeading>Date</TableHeading>
                                                <TableHeading>Status</TableHeading>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttendance.map((record) => {
                                                const student = studentMap.get(record.student_id);

                                                return (
                                                    <tr
                                                        key={record.id}
                                                        className="border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.02]"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm font-medium">
                                                                {getStudentName(student)}
                                                            </p>
                                                            <p className="mt-1 text-xs text-foreground/50">
                                                                {student?.student_number ?? "—"}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm">
                                                                {student?.academic_program ?? "—"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-foreground/50">
                                                                {student?.year_level ?? "—"}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm">
                                                            {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-foreground/70">
                                                            {formatDate(record.attendance_date)}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <StatusBadge status={record.status} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex min-w-0 flex-col gap-3 p-3 xl:hidden">
                                    {filteredAttendance.map((record) => {
                                        const student = studentMap.get(record.student_id);

                                        return (
                                            <article
                                                key={record.id}
                                                className="flex min-w-0 flex-col gap-3 rounded-xl border border-foreground/15 p-3 sm:p-4"
                                            >
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="break-words font-semibold">
                                                            {getStudentName(student)}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-foreground/50">
                                                            {student?.student_number ?? "—"}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={record.status} />
                                                </div>

                                                <div className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Program
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {student?.academic_program ?? "—"}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Year Level
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {student?.year_level ?? "—"}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Subject
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Date
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {formatDate(record.attendance_date)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {record.remarks && (
                                                    <p className="break-words text-xs text-foreground/60">
                                                        Remarks: {record.remarks}
                                                    </p>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}

            {/* Grade Report */}
            {reportType === "grades" && (
                <>
                    <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
                        <MetricCard
                            label="Grade Records"
                            value={gradeSummary.count}
                            icon={<FileSpreadsheet size={18} />}
                        />
                        <MetricCard
                            label="Average Grade"
                            value={gradeSummary.count ? gradeSummary.average.toFixed(2) : "—"}
                            icon={<TrendingUp size={18} />}
                        />
                        <MetricCard
                            label="Highest Grade"
                            value={gradeSummary.count ? gradeSummary.highest.toFixed(2) : "—"}
                            color="text-emerald-600"
                        />
                        <MetricCard
                            label="Lowest Grade"
                            value={gradeSummary.count ? gradeSummary.lowest.toFixed(2) : "—"}
                            color="text-amber-600"
                        />
                    </section>

                    <section className="min-w-0 rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)]">
                        <ReportSectionHeader
                            title="Student Grade Report"
                            subtitle={`${filteredGrades.length} grade records found`}
                        />

                        {filteredGrades.length === 0 ? (
                            <EmptyState message="No grade records match the selected filters." />
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto xl:block">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead>
                                            <tr className="border-b border-foreground/20 bg-foreground/[0.025]">
                                                <TableHeading>Student</TableHeading>
                                                <TableHeading>Subject</TableHeading>
                                                <TableHeading>Semester</TableHeading>
                                                <TableHeading>Grading Period</TableHeading>
                                                <TableHeading>Grade</TableHeading>
                                                <TableHeading>Remarks</TableHeading>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredGrades.map((record, index) => {
                                                const student = studentMap.get(record.student_id);
                                                const grade = Number(record.grade);

                                                return (
                                                    <tr
                                                        key={`${record.requirement_id}-${record.student_id}-${index}`}
                                                        className="border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.02]"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm font-medium">
                                                                {getStudentName(student)}
                                                            </p>
                                                            <p className="mt-1 text-xs text-foreground/50">
                                                                {student?.student_number ?? "—"}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm">
                                                            {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm">
                                                            {record.semester}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm">
                                                            {record.grading_period}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="font-semibold">
                                                                {Number.isFinite(grade) ? grade.toFixed(2) : "—"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-foreground/60">
                                                            {record.remarks || "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex min-w-0 flex-col gap-3 p-3 xl:hidden">
                                    {filteredGrades.map((record, index) => {
                                        const student = studentMap.get(record.student_id);
                                        const grade = Number(record.grade);

                                        return (
                                            <article
                                                key={`${record.requirement_id}-${record.student_id}-${index}`}
                                                className="flex min-w-0 flex-col gap-3 rounded-xl border border-foreground/15 p-3 sm:p-4"
                                            >
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="break-words font-semibold">
                                                            {getStudentName(student)}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-foreground/50">
                                                            {student?.student_number ?? "—"}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                                                        {Number.isFinite(grade) ? grade.toFixed(2) : "—"}
                                                    </span>
                                                </div>

                                                <div className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Subject
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {subjectMap.get(record.subject_id)?.name ?? "Unknown subject"}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Semester
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {record.semester}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Grading Period
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {record.grading_period}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground/50">
                                                            Remarks
                                                        </p>
                                                        <p className="mt-1 break-words font-medium">
                                                            {record.remarks || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}

            <footer className="flex min-w-0 flex-col gap-2 border-t border-foreground/10 py-4 text-sm text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
                <p>LearnersKit · Academic Reports</p>
                <p className="break-words">
                    {educatorId && adminId
                        ? "Showing records available to your educator account."
                        : "Educator account not verified."}
                </p>
            </footer>
        </div>
    );
}

function FilterSelect({
    id,
    label,
    value,
    onChange,
    options,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label
                htmlFor={id}
                className="text-sm font-medium text-foreground/70"
            >
                {label}
            </label>

            <div className="relative min-w-0">
                <select
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-foreground/20 bg-white px-3 py-3 pr-10 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)] dark:bg-[var(--card)]"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                />
            </div>
        </div>
    );
}

function FilterInput({
    id,
    label,
    type,
    value,
    onChange,
}: {
    id: string;
    label: string;
    type: "date";
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label
                htmlFor={id}
                className="text-sm font-medium text-foreground/70"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full min-w-0 cursor-pointer rounded-xl border border-foreground/20 bg-white px-3 py-3 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)] dark:bg-[var(--card)]"
            />
        </div>
    );
}

function MetricCard({
    label,
    value,
    icon,
    color = "text-foreground",
    description,
}: {
    label: string;
    value: string | number;
    icon?: ReactNode;
    color?: string;
    description?: string;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-foreground/20 bg-white p-3 dark:bg-[var(--card)] sm:gap-3 sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-2">
                <p className="min-w-0 text-xs font-medium leading-5 text-foreground/60 sm:text-sm">
                    {label}
                </p>
                {icon && (
                    <span className="shrink-0 text-[var(--primary)]">
                        {icon}
                    </span>
                )}
            </div>
            <p className={`break-words text-xl font-bold tracking-tight sm:text-2xl ${color}`}>
                {value}
            </p>
            {description && (
                <p className="break-words text-xs leading-5 text-foreground/50 sm:text-sm">
                    {description}
                </p>
            )}
        </div>
    );
}

function SmallMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="min-w-0 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-3 sm:p-4">
            <p className="break-words text-xs text-foreground/60 sm:text-sm">
                {label}
            </p>
            <p className="mt-2 break-words text-lg font-bold sm:text-xl">
                {value}
            </p>
        </div>
    );
}

function AttendanceBar({
    label,
    count,
    total,
    color,
}: {
    label: string;
    count: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{label}</span>
                <span className="shrink-0 text-foreground/60">
                    {count} · {percentage.toFixed(1)}%
                </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-foreground/5">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
    return (
        <span
            className={`inline-flex shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                STATUS_STYLES[status] ??
                "bg-foreground/5 text-foreground/60"
            }`}
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function ReportSectionHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1 border-b border-foreground/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
            </div>
        </div>
    );
}

function TableHeading({ children }: { children: ReactNode }) {
    return (
        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            {children}
        </th>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex min-w-0 flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileSpreadsheet size={23} />
            </div>
            <p className="max-w-sm break-words text-sm text-foreground/60">
                {message}
            </p>
        </div>
    );
}