
"use client";

import { useEffect, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    Users,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    GraduationCap,
    Activity,
    UserRound,
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
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
    full_name: string | null;
    admin_id: string | null;
    role: string;
};

type StudentRecord = {
    id: string;
    student_number: string | null;
    first_name: string;
    last_name: string;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type StudentSubject = {
    id: string;
    name: string;
    code: string | null;
};

type StudentSubjectEnrollment = {
    subject_id: string;
};

type AttendanceRecord = {
    status: string | null;
};

type GradeRecord = {
    grading_period: string | null;
};

type ChartItem = {
    name: string;
    value: number;
};

const COLORS = [
    "#8A75CF",
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
        <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-foreground/50">
            {message}
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
    value: string;
    description: string;
    icon: typeof Users;
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

export default function Dashboard() {
    const [studentName, setStudentName] = useState("Student");
    const [student, setStudent] = useState<StudentRecord | null>(null);
    const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>(
        []
    );

    const [counts, setCounts] = useState({
        subjects: 0,
        attendance: 0,
        grades: 0,
    });

    const [attendanceData, setAttendanceData] = useState<ChartItem[]>([]);
    const [gradeData, setGradeData] = useState<ChartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchDashboardData() {
            setLoading(true);
            setError("");

            try {
                // 1. Get the authenticated student.
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    window.location.replace("/login");
                    return;
                }

                // 2. Load the student's profile and linked administrator.
                const { data: profile, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("full_name, admin_id, role")
                        .eq("id", user.id)
                        .single();

                if (profileError) throw profileError;

                const studentProfile = profile as StudentProfile;

                if (studentProfile.role !== "student") {
                    window.location.replace("/login");
                    return;
                }

                if (!studentProfile.admin_id) {
                    throw new Error(
                        "Your account is not linked to an administrator yet. Please complete the claim-code step."
                    );
                }

                // 3. Find the student record linked by the claim-code process.
                const { data: studentRow, error: studentError } =
                    await supabase
                        .from("students")
                        .select(
                            "id, student_number, first_name, last_name, department, academic_program, year_level"
                        )
                        .eq("user_id", user.id)
                        .eq("admin_id", studentProfile.admin_id)
                        .maybeSingle();

                if (studentError) {
                    throw new Error(
                        `Student lookup failed: ${studentError.message}`
                    );
                }

                if (!studentRow) {
                    throw new Error(
                        "No student record is linked to your account. Please contact your school administrator."
                    );
                }

                const studentRecord = studentRow as StudentRecord;

                // 4. Fetch this student's enrollments, attendance, and grades.
                const [
                    enrollmentsResult,
                    attendanceResult,
                    gradesResult,
                ] = await Promise.all([
                    supabase
                        .from("student_subjects")
                        .select("subject_id")
                        .eq("admin_id", studentProfile.admin_id)
                        .eq("student_id", studentRecord.id),

                    supabase
                        .from("attendance")
                        .select("status")
                        .eq("admin_id", studentProfile.admin_id)
                        .eq("student_id", studentRecord.id),

                    supabase
                        .from("grades")
                        .select("grading_period")
                        .eq("admin_id", studentProfile.admin_id)
                        .eq("student_id", studentRecord.id),
                ]);

                if (enrollmentsResult.error) {
                    throw new Error(
                        `Student subject enrollments: ${enrollmentsResult.error.message}`
                    );
                }

                if (attendanceResult.error) {
                    throw new Error(
                        `Attendance: ${attendanceResult.error.message}`
                    );
                }

                if (gradesResult.error) {
                    throw new Error(
                        `Grades: ${gradesResult.error.message}`
                    );
                }

                // 5. Get the details for the subjects this student is enrolled in.
                const subjectIds = [
                    ...new Set(
                        (
                            (enrollmentsResult.data ?? []) as StudentSubjectEnrollment[]
                        ).map((enrollment) => enrollment.subject_id)
                    ),
                ];

                let loadedSubjects: StudentSubject[] = [];

                if (subjectIds.length > 0) {
                    const { data: subjectData, error: subjectError } =
                        await supabase
                            .from("subjects")
                            .select("id, name, code")
                            .eq("admin_id", studentProfile.admin_id)
                            .in("id", subjectIds)
                            .order("name", { ascending: true });

                    if (subjectError) {
                        throw new Error(
                            `Subject details: ${subjectError.message}`
                        );
                    }

                    loadedSubjects = (subjectData ?? []) as StudentSubject[];
                }

                const attendanceRecords =
                    (attendanceResult.data ?? []) as AttendanceRecord[];

                const gradeRecords =
                    (gradesResult.data ?? []) as GradeRecord[];

                // 6. Group attendance records by status.
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

                // 7. Group grade records by grading period.
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

                if (!cancelled) {
                    // Use the official name from the student record.
                    const officialName =
                        `${studentRecord.first_name} ${studentRecord.last_name}`.trim();

                    setStudentName(officialName || "Student");
                    setStudent(studentRecord);
                    setStudentSubjects(loadedSubjects);

                    setCounts({
                        subjects: loadedSubjects.length,
                        attendance: attendanceRecords.length,
                        grades: gradeRecords.length,
                    });

                    setAttendanceData(newAttendanceData);
                    setGradeData(newGradeData);
                }
            } catch (err) {
                console.error("Student dashboard error:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load your dashboard."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchDashboardData();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalAttendance = attendanceData.reduce(
        (total, item) => total + item.value,
        0
    );

    const totalGrades = gradeData.reduce(
        (total, item) => total + item.value,
        0
    );

    const attendanceStatus = attendanceData.find(
        (item) => item.name.toLowerCase() === "present"
    );

    const attendanceRate =
        totalAttendance > 0
            ? Math.round(
                  ((attendanceStatus?.value ?? 0) / totalAttendance) * 100
              )
            : 0;

    const formatCount = (value: number) =>
        loading ? "..." : numberFormatter.format(value);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 hide-scrollbar sm:gap-6 sm:p-6">
            {/* Welcome header */}
            <header className="flex min-w-0 flex-col gap-4 px-1 sm:px-2">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Good day, {studentName}
                        </h1>

                        <MdWavingHand
                            size={25}
                            className="shrink-0 text-[var(--primary)]"
                        />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-foreground/60 sm:text-base">
                        Here's an overview of your academic journey.
                    </p>
                </div>
            </header>

            {/* Student information */}
            <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <UserRound size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-foreground">
                            My Student Profile
                        </h2>

                        <p className="mt-1 text-sm text-foreground/55">
                            Your registered academic information.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="mt-5 text-sm text-foreground/50">
                        Loading your profile...
                    </p>
                ) : student ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-foreground/10 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <p className="text-xs text-foreground/50">
                                Student number
                            </p>
                            <p className="mt-1 break-words text-sm font-medium">
                                {student.student_number || "Not assigned"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-foreground/50">
                                Department
                            </p>
                            <p className="mt-1 break-words text-sm font-medium">
                                {student.department || "Not assigned"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-foreground/50">
                                Academic program
                            </p>
                            <p className="mt-1 break-words text-sm font-medium">
                                {student.academic_program || "Not assigned"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-foreground/50">
                                Year level
                            </p>
                            <p className="mt-1 break-words text-sm font-medium">
                                {student.year_level || "Not assigned"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="mt-5 text-sm text-foreground/50">
                        Student profile information is unavailable.
                    </p>
                )}
            </section>

            {/* My Subjects */}
            <section className="flex flex-col gap-4">
                <div className="px-1 sm:px-2">
                    <h2 className="text-lg font-bold text-foreground">
                        My Subjects
                    </h2>
                    <p className="mt-1 text-sm text-foreground/55">
                        Subjects assigned to your student record.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white p-6 text-sm text-foreground/50 dark:bg-[var(--card)]">
                        Loading your subjects...
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white p-6 text-sm text-red-600 dark:bg-[var(--card)] dark:text-red-400">
                        Your subjects could not be loaded. {error}
                    </div>
                ) : studentSubjects.length === 0 ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white p-8 text-center shadow-sm dark:bg-[var(--card)]">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <BookOpen size={24} />
                        </div>

                        <h3 className="mt-3 font-semibold text-foreground">
                            No subjects assigned yet
                        </h3>

                        <p className="mt-1 text-sm text-foreground/55">
                            Your assigned subjects will appear here once your
                            school administrator enrolls you.
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {studentSubjects.map((subject) => (
                            <article
                                key={subject.id}
                                className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[var(--card)]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                        <BookOpen size={22} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="break-words font-semibold text-foreground">
                                            {subject.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-foreground/55">
                                            {subject.code || "No subject code"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-foreground/10 pt-3">
                                    <span className="text-xs font-medium text-foreground/50">
                                        Enrolled subject
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Academic Summary */}
            <section className="flex flex-col gap-1 px-1 sm:px-2">
                <h2 className="text-lg font-bold text-foreground">
                    Academic Summary
                </h2>
                <p className="text-sm text-foreground/55">
                    A quick look at your academic records.
                </p>
            </section>

            <section
                aria-label="Academic summary"
                className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
                <SummaryCard
                    title="Enrolled Subjects"
                    value={formatCount(counts.subjects)}
                    description="Subjects assigned to your student record"
                    icon={BookOpen}
                />

                <SummaryCard
                    title="Attendance Records"
                    value={formatCount(counts.attendance)}
                    description="Your recorded attendance entries"
                    icon={CalendarCheck}
                />

                <SummaryCard
                    title="Grade Records"
                    value={formatCount(counts.grades)}
                    description="Your recorded academic grades"
                    icon={ClipboardList}
                />
            </section>

            {/* Academic overview */}
            <section className="flex flex-col gap-1 px-1 sm:px-2">
                <h2 className="text-lg font-bold text-foreground">
                    Academic Overview
                </h2>
                <p className="text-sm text-foreground/55">
                    Review your attendance and grading activity.
                </p>
            </section>

            <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Attendance */}
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
                                Your records by attendance status
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <EmptyChart message="Loading attendance data..." />
                    ) : error ? (
                        <EmptyChart message="Attendance data could not be loaded." />
                    ) : totalAttendance === 0 ? (
                        <EmptyChart message="You don't have any attendance records yet." />
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
                                            {attendanceData.map(
                                                (item, index) => (
                                                    <Cell
                                                        key={item.name}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
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
                                        Total Records
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
                                                    backgroundColor:
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ],
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
                                                {(
                                                    (item.value /
                                                        totalAttendance) *
                                                    100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center justify-between rounded-xl bg-[var(--accent)]/60 p-4 dark:bg-foreground/5">
                                <div>
                                    <p className="text-sm font-medium">
                                        Recorded present rate
                                    </p>
                                    <p className="mt-1 text-xs text-foreground/55">
                                        Based on records marked Present
                                    </p>
                                </div>
                                <span className="text-xl font-bold text-[var(--primary)]">
                                    {attendanceRate}%
                                </span>
                            </div>
                        </>
                    )}
                </article>

                {/* Grades */}
                <article className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <GraduationCap size={21} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground">
                                Grade Overview
                            </h3>
                            <p className="mt-1 text-sm text-foreground/55">
                                Grade records by grading period
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <EmptyChart message="Loading grade data..." />
                    ) : error ? (
                        <EmptyChart message="Grade data could not be loaded." />
                    ) : totalGrades === 0 ? (
                        <EmptyChart message="You don't have any grade records yet." />
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm text-foreground/55">
                                        Total grade records
                                    </p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                        {numberFormatter.format(totalGrades)}
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
                                        margin={{
                                            top: 12,
                                            right: 8,
                                            left: -18,
                                            bottom: 8,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#9ca3af"
                                            strokeOpacity={0.2}
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fontSize: 11,
                                                fill: "#888888",
                                            }}
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
                                            tick={{
                                                fontSize: 11,
                                                fill: "#888888",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                `${numberFormatter.format(Number(value))} records`,
                                                "Grade records",
                                            ]}
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

            {/* Academic reminder */}
            <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <BookOpen size={21} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground">
                            Keep track of your progress
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-foreground/60">
                            Check your attendance regularly and review your
                            academic records as your educators update them.
                            Contact your school administrator if any
                            information appears incorrect.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
