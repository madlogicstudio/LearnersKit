
"use client";

import { useEffect, useState } from "react";
import {
    Users,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    GraduationCap,
    Sparkles,
    Activity,
} from "lucide-react";
import { MdWavingHand } from "react-icons/md";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import { DashboardCard } from "./DashboardCard";
import { createClient } from "@/lib/supabase/client";

type DashboardCounts = {
    students: number;
    subjects: number;
    attendance: number;
    grades: number;
};

type AttendanceRecord = {
    status: string | null;
};

type GradeRecord = {
    grading_period: string | null;
};

type StudentDepartmentRow = {
    department: string | null;
};

type SubjectRow = {
    id: string;
    name: string | null;
};

type DepartmentRow = {
    id: string;
    name: string;
};

type ChartItem = {
    name: string;
    value: number;
};

const COLORS = [
    "#5578C9",
    "#96B4EB",
    "#D789B9",
    "#F6E06F",
    "#75B798",
];

const numberFormatter = new Intl.NumberFormat("en-US");

const chartTooltipStyle = {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "12px",
    backgroundColor: "var(--tooltip-bg, #ffffff)",
};

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex h-full min-h-48 items-center justify-center px-4 text-center text-sm text-foreground/50">
            {message}
        </div>
    );
}

export default function Dashboard() {
    const [counts, setCounts] = useState<DashboardCounts>({
        students: 0,
        subjects: 0,
        attendance: 0,
        grades: 0,
    });

    const [attendanceData, setAttendanceData] = useState<ChartItem[]>([]);
    const [gradeData, setGradeData] = useState<ChartItem[]>([]);
    const [studentDepartmentData, setStudentDepartmentData] = useState<ChartItem[]>([]);
    const [subjectData, setSubjectData] = useState<ChartItem[]>([]);
    const [educatorName, setEducatorName] = useState("Educator");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchDashboardData() {
            setLoading(true);
            setError("");

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    throw new Error("No authenticated user found.");
                }

                const { data: profile, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("full_name, admin_id, role")
                        .eq("id", user.id)
                        .single();

                if (profileError) throw profileError;

                if (profile.role !== "educator") {
                    throw new Error("This dashboard is for educators only.");
                }

                if (!profile.admin_id) {
                    throw new Error(
                        "Your account is not linked to an administrator yet."
                    );
                }

                const adminId = profile.admin_id;

                const [
                    studentsResult,
                    subjectsResult,
                    attendanceCountResult,
                    gradesCountResult,
                    attendanceChartResult,
                    gradesChartResult,
                    studentDepartmentsResult,
                    subjectChartResult,
                ] = await Promise.all([
                    supabase
                        .from("students")
                        .select("id", { count: "exact", head: true })
                        .eq("admin_id", adminId),

                    supabase
                        .from("subjects")
                        .select("id", { count: "exact", head: true })
                        .eq("admin_id", adminId),

                    supabase
                        .from("attendance")
                        .select("id", { count: "exact", head: true })
                        .eq("admin_id", adminId),

                    supabase
                        .from("grades")
                        .select("id", { count: "exact", head: true })
                        .eq("admin_id", adminId),

                    supabase
                        .from("attendance")
                        .select("status")
                        .eq("admin_id", adminId)
                        .eq("educator_id", user.id),

                    supabase
                        .from("grades")
                        .select("grading_period")
                        .eq("admin_id", adminId)
                        .eq("educator_id", user.id),

                    supabase
                        .from("students")
                        .select("department")
                        .eq("admin_id", adminId),

                    // Fixed: subjects.department_id does not exist.
                    supabase
                        .from("subjects")
                        .select("id, name")
                        .eq("admin_id", adminId),
                ]);

                const results = [
                    { name: "Students", result: studentsResult },
                    { name: "Subjects", result: subjectsResult },
                    { name: "Attendance", result: attendanceCountResult },
                    { name: "Grades", result: gradesCountResult },
                    { name: "Attendance chart", result: attendanceChartResult },
                    { name: "Grades chart", result: gradesChartResult },
                    {
                        name: "Student departments",
                        result: studentDepartmentsResult,
                    },
                    { name: "Subject chart", result: subjectChartResult },
                ];

                for (const item of results) {
                    if (item.result.error) {
                        throw new Error(
                            `${item.name}: ${item.result.error.message}`
                        );
                    }
                }

                const attendanceRecords =
                    (attendanceChartResult.data ?? []) as AttendanceRecord[];

                const gradeRecords =
                    (gradesChartResult.data ?? []) as GradeRecord[];

                const studentRows =
                    (studentDepartmentsResult.data ?? []) as StudentDepartmentRow[];

                const subjectRows =
                    (subjectChartResult.data ?? []) as SubjectRow[];

                // Attendance records grouped by status.
                const attendanceCounts = new Map<string, number>();

                attendanceRecords.forEach((record) => {
                    const status = record.status?.trim() || "Unspecified";

                    attendanceCounts.set(
                        status,
                        (attendanceCounts.get(status) ?? 0) + 1
                    );
                });

                const newAttendanceData = Array.from(
                    attendanceCounts,
                    ([name, value]) => ({ name, value })
                ).sort((a, b) => b.value - a.value);

                // Grade records grouped by grading period.
                const gradeCounts = new Map<string, number>();

                gradeRecords.forEach((record) => {
                    const period =
                        record.grading_period?.trim() || "Unspecified";

                    gradeCounts.set(
                        period,
                        (gradeCounts.get(period) ?? 0) + 1
                    );
                });

                const newGradeData = Array.from(
                    gradeCounts,
                    ([name, value]) => ({ name, value })
                );

                // Students grouped by department.
                const studentCounts = new Map<string, number>();

                studentRows.forEach((student) => {
                    const name =
                        student.department?.trim() || "Unassigned";

                    studentCounts.set(
                        name,
                        (studentCounts.get(name) ?? 0) + 1
                    );
                });

                const newStudentDepartmentData = Array.from(
                    studentCounts,
                    ([name, value]) => ({ name, value })
                ).sort((a, b) => b.value - a.value);

                // Subjects grouped by subject name.
                // No department_id column is required.
                const subjectCounts = new Map<string, number>();

                subjectRows.forEach((subject) => {
                    const name = subject.name?.trim() || "Unnamed subject";

                    subjectCounts.set(
                        name,
                        (subjectCounts.get(name) ?? 0) + 1
                    );
                });

                const newSubjectData = Array.from(
                    subjectCounts,
                    ([name, value]) => ({ name, value })
                ).sort((a, b) => b.value - a.value);

                if (!cancelled) {
                    setEducatorName(profile.full_name?.trim() || "Educator");

                    setCounts({
                        students: studentsResult.count ?? 0,
                        subjects: subjectsResult.count ?? 0,
                        attendance: attendanceCountResult.count ?? 0,
                        grades: gradesCountResult.count ?? 0,
                    });

                    setAttendanceData(newAttendanceData);
                    setGradeData(newGradeData);
                    setStudentDepartmentData(newStudentDepartmentData);
                    setSubjectData(newSubjectData);
                }
            } catch (err) {
                console.error("Educator dashboard error:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load dashboard data."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchDashboardData();

        return () => {
            cancelled = true;
        };
    }, []);

    const formatCount = (value: number) =>
        loading ? "..." : numberFormatter.format(value);

    const totalAttendance = attendanceData.reduce(
        (total, item) => total + item.value,
        0
    );

    const totalGradeRecords = gradeData.reduce(
        (total, item) => total + item.value,
        0
    );

    const totalStudentsByDepartment = studentDepartmentData.reduce(
        (total, item) => total + item.value,
        0
    );

    const totalSubjectChartRecords = subjectData.reduce(
        (total, item) => total + item.value,
        0
    );

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 hide-scrollbar sm:gap-6 sm:p-6">
            {/* Welcome header */}
            <header className="flex min-w-0 flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                <div className="min-w-full flex flex-row items-end justify-between">
  
                    <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-foreground ">
                        Good day, {educatorName}
                        <MdWavingHand
                            size={25}
                            className="shrink-0 text-[var(--primary)]"
                        />
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-foreground/60 sm:text-base">
                        Here&apos;s an overview of your academic activities.
                    </p>
                </div>

            </header>

            {/* Error message */}
            {error && (
                <div
                    role="alert"
                    className="mx-1 rounded-xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                    <p className="font-semibold">Unable to load dashboard</p>
                    <p className="mt-1">{error}</p>
                </div>
            )}

            {/* Summary cards */}
            <section className="flex flex-col gap-1 px-1 sm:px-2">
                <h2 className="text-lg font-bold text-foreground">
                    Academic summary
                </h2>
                <p className="text-sm text-foreground/55">
                    A quick look at the records available to your institution.
                </p>
            </section>

            <section
                aria-label="Academic summary"
                className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                <DashboardCard
                    title="My Students"
                    value={formatCount(counts.students)}
                    description="Students under your institution"
                    icon={Users}
                />

                <DashboardCard
                    title="My Subjects"
                    value={formatCount(counts.subjects)}
                    description="Available academic subjects"
                    icon={BookOpen}
                />

                <DashboardCard
                    title="Attendance Records"
                    value={formatCount(counts.attendance)}
                    description="Recorded attendance entries"
                    icon={CalendarCheck}
                />

                <DashboardCard
                    title="Grade Records"
                    value={formatCount(counts.grades)}
                    description="Recorded academic grades"
                    icon={ClipboardList}
                />
            </section>

            {/* Charts heading */}
            <section className="flex flex-col gap-1 px-1 sm:px-2">
                <h2 className="text-lg font-bold text-foreground">
                    Academic overview
                </h2>
                <p className="text-sm text-foreground/55">
                    Explore attendance, grading activity, students, and subjects.
                </p>
            </section>

            {/* Attendance and grades */}
            <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Attendance chart */}
                <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <CalendarCheck size={21} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Attendance Overview
                            </h3>
                            <p className="mt-1 text-sm text-foreground/55">
                                Distribution by attendance status
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
                            Loading attendance data...
                        </div>
                    ) : error ? (
                        <EmptyChart message="Attendance data could not be loaded." />
                    ) : totalAttendance === 0 ? (
                        <EmptyChart message="No attendance records have been recorded for your account yet." />
                    ) : (
                        <>
                            <div className="relative h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={66}
                                            outerRadius={96}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {attendanceData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                `${numberFormatter.format(Number(value))} records`,
                                                String(name),
                                            ]}
                                            contentStyle={chartTooltipStyle}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {numberFormatter.format(totalAttendance)}
                                    </span>
                                    <span className="mt-1 text-xs text-foreground/50">
                                        Your Records
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {attendanceData.map((item, index) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor: COLORS[index % COLORS.length],
                                                }}
                                            />
                                            <span className="truncate text-sm text-foreground/70">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-sm font-medium text-foreground">
                                                {numberFormatter.format(item.value)}
                                            </span>
                                            <span className="w-12 text-right text-xs text-foreground/50">
                                                {((item.value / totalAttendance) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </article>

                {/* Grades chart */}
                <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <ClipboardList size={21} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Academic Overview
                            </h3>
                            <p className="mt-1 text-sm text-foreground/55">
                                Grade records by grading period
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
                            Loading academic data...
                        </div>
                    ) : error ? (
                        <EmptyChart message="Academic data could not be loaded." />
                    ) : totalGradeRecords === 0 ? (
                        <EmptyChart message="No grade records have been recorded for your account yet." />
                    ) : (
                        <>
                            <div className="mb-3 flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-sm text-foreground/55">
                                        Total grade records
                                    </p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                        {numberFormatter.format(totalGradeRecords)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-[var(--primary)]/15 p-3 text-[var(--primary)]">
                                    <Activity size={21} />
                                </div>
                            </div>

                            <div className="h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={gradeData}
                                        margin={{ top: 12, right: 8, left: -18, bottom: 8 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#9ca3af"
                                            strokeOpacity={0.2}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#888888" }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            tickFormatter={(value: string) =>
                                                value.length > 12
                                                    ? `${value.slice(0, 12)}…`
                                                    : value
                                            }
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: "#888888" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${numberFormatter.format(Number(value))} records`,
                                                "Grade records",
                                            ]}
                                            labelFormatter={(label) => `Period: ${label}`}
                                            contentStyle={chartTooltipStyle}
                                        />
                                        <Bar
                                            dataKey="value"
                                            name="Grade records"
                                            fill="#8A75CF"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={52}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 border-t border-foreground/10 pt-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-foreground/55">
                                        Grading periods with records
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {gradeData.length}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </article>
            </section>

            {/* Student and subject charts */}
            <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Students by department */}
                <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <Users size={21} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Students by Department
                            </h3>
                            <p className="mt-1 text-sm text-foreground/55">
                                Distribution of registered students
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
                            Loading student data...
                        </div>
                    ) : error ? (
                        <EmptyChart message="Student data could not be loaded." />
                    ) : totalStudentsByDepartment === 0 ? (
                        <EmptyChart message="No students have been registered yet." />
                    ) : (
                        <>
                            <div className="relative h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={studentDepartmentData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={66}
                                            outerRadius={96}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {studentDepartmentData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [
                                                `${numberFormatter.format(Number(value))} students`,
                                                "Students",
                                            ]}
                                            contentStyle={chartTooltipStyle}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {numberFormatter.format(totalStudentsByDepartment)}
                                    </span>
                                    <span className="mt-1 text-xs text-foreground/50">
                                        Total Students
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {studentDepartmentData.map((item, index) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor: COLORS[index % COLORS.length],
                                                }}
                                            />
                                            <span className="truncate text-sm text-foreground/70">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-sm font-medium text-foreground">
                                                {numberFormatter.format(item.value)}
                                            </span>
                                            <span className="w-12 text-right text-xs text-foreground/50">
                                                {((item.value / totalStudentsByDepartment) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </article>

                {/* Subjects overview */}
                <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <BookOpen size={21} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Subjects Overview
                            </h3>
                            <p className="mt-1 text-sm text-foreground/55">
                                Distribution of available subjects
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
                            Loading subject data...
                        </div>
                    ) : error ? (
                        <EmptyChart message="Subject data could not be loaded." />
                    ) : totalSubjectChartRecords === 0 ? (
                        <EmptyChart message="No subjects have been added yet." />
                    ) : (
                        <>
                            <div className="mb-3">
                                <p className="text-sm text-foreground/55">
                                    Total subjects
                                </p>
                                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                    {formatCount(counts.subjects)}
                                </p>
                            </div>

                            <div className="h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={subjectData}
                                        margin={{ top: 12, right: 8, left: -18, bottom: 8 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#9ca3af"
                                            strokeOpacity={0.2}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#888888" }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            tickFormatter={(value: string) =>
                                                value.length > 12
                                                    ? `${value.slice(0, 12)}…`
                                                    : value
                                            }
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: "#888888" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${numberFormatter.format(Number(value))} entries`,
                                                "Subject entries",
                                            ]}
                                            labelFormatter={(label) => `Subject: ${label}`}
                                            contentStyle={chartTooltipStyle}
                                        />
                                        <Bar
                                            dataKey="value"
                                            name="Subject entries"
                                            fill="#5578C9"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={52}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </article>
            </section>

        </div>
    );
}
