"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Download, RefreshCw, Users, BookOpen, GraduationCap, Layers3, AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";
import { WanderingEyes } from "@/components/ui/WanderingEyes";

type Course = {
    id: string;
    name: string;
};

type Student = {
    id: string;
    course_id: string | null;
    created_at: string;
};

type ReportData = {
    students: Student[];
    courses: Course[];
    yearCount: number;
    subjectCount: number;
};

const COLORS = ["#C9A0DC", "#8A75CF", "#7CA9E8", "#69B7A5", "#E7B66D", "#DB829A"];

const cardClass =
    "rounded-xl border border-foreground/10 bg-white p-5 dark:bg-[var(--card)]";

export default function Reports() {
    const supabase = useMemo(() => createClient(), []);

    const [data, setData] = useState<ReportData>({
        students: [],
        courses: [],
        yearCount: 0,
        subjectCount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please log in to view reports.");
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Only administrators can view these reports.");
            }

            const [
                { data: studentRows, error: studentError },
                { data: courseRows, error: courseError },
                { count: yearCount, error: yearError },
                { count: subjectCount, error: subjectError },
            ] = await Promise.all([
                supabase
                    .from("students")
                    .select("id, course_id, created_at")
                    .eq("admin_id", user.id),

                supabase
                    .from("courses")
                    .select("id, name")
                    .eq("admin_id", user.id)
                    .order("name"),

                supabase
                    .from("year_levels")
                    .select("id", { count: "exact", head: true })
                    .eq("admin_id", user.id),

                supabase
                    .from("subjects")
                    .select("id", { count: "exact", head: true })
                    .eq("admin_id", user.id),
            ]);

            if (studentError) throw studentError;
            if (courseError) throw courseError;
            if (yearError) throw yearError;
            if (subjectError) throw subjectError;

            setData({
                students: (studentRows ?? []) as Student[],
                courses: (courseRows ?? []) as Course[],
                yearCount: yearCount ?? 0,
                subjectCount: subjectCount ?? 0,
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load reports."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    const enrollmentTrend = useMemo(() => {
        const now = new Date();

        return Array.from({ length: 6 }, (_, index) => {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - 5 + index,
                1
            );

            const year = date.getFullYear();
            const month = date.getMonth();

            const count = data.students.filter((student) => {
                const created = new Date(student.created_at);

                return (
                    !Number.isNaN(created.getTime()) &&
                    created.getFullYear() === year &&
                    created.getMonth() === month
                );
            }).length;

            return {
                month: date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                }),
                students: count,
            };
        });
    }, [data.students]);

    const courseDistribution = useMemo(() => {
        return data.courses
            .map((course) => ({
                name: course.name,
                students: data.students.filter(
                    (student) => student.course_id === course.id
                ).length,
            }))
            .sort((a, b) => b.students - a.students);
    }, [data.courses, data.students]);

    const unassignedCount = data.students.filter(
        (student) => !student.course_id
    ).length;

    const totalStudents = data.students.length;

    async function exportPDF() {
        setExporting(true);

        try {
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();

            pdf.setFillColor(42, 38, 49);
            pdf.rect(0, 0, pageWidth, 43, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(21);
            pdf.setFont("helvetica", "bold");
            pdf.text("LearnersKit", 14, 17);

            pdf.setFontSize(15);
            pdf.text("Administrative Reports", 14, 28);

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(
                `Generated: ${new Date().toLocaleString()}`,
                14,
                36
            );

            pdf.setTextColor(45, 43, 54);
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Summary", 14, 55);

            autoTable(pdf, {
                startY: 60,
                head: [["Metric", "Total"]],
                body: [
                    ["Total students", String(totalStudents)],
                    ["Total courses", String(data.courses.length)],
                    ["Total year levels", String(data.yearCount)],
                    ["Total subjects", String(data.subjectCount)],
                    ["Students without a course", String(unassignedCount)],
                ],
                theme: "grid",
                headStyles: {
                    fillColor: [138, 117, 207],
                    textColor: 255,
                },
                styles: { fontSize: 10, cellPadding: 4 },
            });

            const summary = pdf as jsPDF & {
                lastAutoTable?: { finalY: number };
            };

            let nextY = (summary.lastAutoTable?.finalY ?? 100) + 12;

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Students by Course", 14, nextY);

            autoTable(pdf, {
                startY: nextY + 5,
                head: [["Course", "Students"]],
                body: [
                    ...courseDistribution.map((course) => [
                        course.name,
                        String(course.students),
                    ]),
                    ...(unassignedCount > 0
                        ? [["No course assigned", String(unassignedCount)]]
                        : []),
                ],
                theme: "grid",
                headStyles: {
                    fillColor: [138, 117, 207],
                    textColor: 255,
                },
                styles: { fontSize: 9, cellPadding: 3 },
            });

            const tableState = pdf as jsPDF & {
                lastAutoTable?: { finalY: number };
            };

            nextY = (tableState.lastAutoTable?.finalY ?? nextY + 10) + 12;

            if (nextY > 240) {
                pdf.addPage();
                nextY = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Enrollment by Month", 14, nextY);

            autoTable(pdf, {
                startY: nextY + 5,
                head: [["Month", "New Student Records"]],
                body: enrollmentTrend.map((item) => [
                    item.month,
                    String(item.students),
                ]),
                theme: "grid",
                headStyles: {
                    fillColor: [138, 117, 207],
                    textColor: 255,
                },
                styles: { fontSize: 9, cellPadding: 3 },
            });

            const fileDate = new Date().toISOString().slice(0, 10);
            pdf.save(`LearnersKit-Report-${fileDate}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            setError("Unable to export the PDF. Please try again.");
        } finally {
            setExporting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-6 overflow-y-auto hide-scrollbar p-5 font-sans text-foreground sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Reports
                    </h1>
                    <p className="mt-2 text-sm text-foreground/60">
                        Monitor student enrollment and academic records.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void loadReports()}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm transition hover:bg-foreground/5"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => void exportPDF()}
                        disabled={exporting}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        <Download size={16} />
                        {exporting ? "Exporting..." : "Export PDF"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-500">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Students"
                    value={totalStudents}
                    description="Student records"
                    icon={<Users size={21} />}
                />
                <MetricCard
                    title="Total Courses"
                    value={data.courses.length}
                    description="Courses in your account"
                    icon={<GraduationCap size={21} />}
                />
                <MetricCard
                    title="Year Levels"
                    value={data.yearCount}
                    description="Configured year levels"
                    icon={<Layers3 size={21} />}
                />
                <MetricCard
                    title="Total Subjects"
                    value={data.subjectCount}
                    description="Configured subjects"
                    icon={<BookOpen size={21} />}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className={cardClass}>
                    <div className="mb-5">
                        <h2 className="font-semibold">Enrollment Trend</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            New student records over the last six months
                        </p>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={enrollmentTrend}
                                margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
                            >
                                <CartesianGrid
                                    stroke="currentColor"
                                    strokeOpacity={0.1}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#9995A2", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: "#9995A2", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#29262F",
                                        border: "1px solid #45404E",
                                        borderRadius: 12,
                                        color: "#fff",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="students"
                                    name="New students"
                                    stroke="#C9A0DC"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#C9A0DC" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="mb-5">
                        <h2 className="font-semibold">Students by Course</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            Distribution of student records across courses
                        </p>
                    </div>

                    {courseDistribution.length === 0 ? (
                        <EmptyChart message="No courses available yet." />
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={courseDistribution}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: -18,
                                        bottom: 35,
                                    }}
                                >
                                    <CartesianGrid
                                        stroke="currentColor"
                                        strokeOpacity={0.1}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        tick={{ fill: "#9995A2", fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: "#9995A2", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#29262F",
                                            border: "1px solid #45404E",
                                            borderRadius: 12,
                                            color: "#fff",
                                        }}
                                    />
                                    <Bar
                                        dataKey="students"
                                        name="Students"
                                        fill="#8A75CF"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>
            </div>

            <section className={cardClass}>
                <div className="mb-5">
                    <h2 className="font-semibold">Course Distribution</h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Compare how students are allocated across courses.
                    </p>
                </div>

                {totalStudents === 0 ? (
                    <EmptyChart message="Student data will appear here when records are added." />
                ) : (
                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                        <div className="h-72 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            ...courseDistribution.filter(
                                                (course) => course.students > 0
                                            ),
                                            ...(unassignedCount > 0
                                                ? [{
                                                    name: "Unassigned",
                                                    students: unassignedCount,
                                                }]
                                                : []),
                                        ]}
                                        dataKey="students"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={3}
                                    >
                                        {[
                                            ...courseDistribution.filter(
                                                (course) => course.students > 0
                                            ),
                                            ...(unassignedCount > 0
                                                ? [{
                                                    name: "Unassigned",
                                                    students: unassignedCount,
                                                }]
                                                : []),
                                        ].map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={
                                                    COLORS[index % COLORS.length]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "#29262F",
                                            border: "1px solid #45404E",
                                            borderRadius: 12,
                                            color: "#fff",
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            {courseDistribution.map((course, index) => (
                                <div
                                    key={course.name}
                                    className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.03] p-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    COLORS[index % COLORS.length],
                                            }}
                                        />
                                        <span className="truncate text-sm">
                                            {course.name}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                                        {course.students}
                                    </span>
                                </div>
                            ))}

                            {unassignedCount > 0 && (
                                <div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] p-3">
                                    <span className="text-sm">Unassigned</span>
                                    <span className="text-sm font-semibold">
                                        {unassignedCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <section className={cardClass}>
                <div className="mb-5">
                    <h2 className="font-semibold">Course Summary</h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Student counts and enrollment percentages per course.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead className="border-b border-foreground/10 text-foreground/50">
                            <tr>
                                <th className="px-3 py-3 font-medium">Course</th>
                                <th className="px-3 py-3 font-medium">Students</th>
                                <th className="px-3 py-3 font-medium">Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/[0.06]">
                            {courseDistribution.map((course) => (
                                <tr key={course.name}>
                                    <td className="px-3 py-4 font-medium">
                                        {course.name}
                                    </td>
                                    <td className="px-3 py-4">
                                        {course.students}
                                    </td>
                                    <td className="px-3 py-4">
                                        {totalStudents > 0
                                            ? `${(
                                                (course.students / totalStudents) *
                                                100
                                            ).toFixed(1)}%`
                                            : "0.0%"}
                                    </td>
                                </tr>
                            ))}

                            {unassignedCount > 0 && (
                                <tr>
                                    <td className="px-3 py-4">
                                        No course assigned
                                    </td>
                                    <td className="px-3 py-4">
                                        {unassignedCount}
                                    </td>
                                    <td className="px-3 py-4">
                                        {((unassignedCount / totalStudents) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            )}

                            {totalStudents === 0 && (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-3 py-8 text-center text-foreground/50"
                                    >
                                        No student records available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <p className="text-xs text-foreground/45">
                Reports reflect the student records currently available to your
                account. Enrollment trends are based on each record&apos;s creation
                date, not necessarily the student&apos;s official enrollment date.
            </p>
        </div>
    );
}

function MetricCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-white p-5 dark:bg-[var(--card)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-foreground/60">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl bg-[#C9A0DC]/15 p-3 text-[var(--primary)]">
                    {icon}
                </div>
            </div>
            <p className="text-sm text-foreground/50">{description}</p>
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex h-72 flex-col items-center justify-center text-center">
            <BookOpen size={28} className="text-[var(--primary)]" />
            <p className="mt-3 text-sm text-foreground/60">{message}</p>
        </div>
    );
}
