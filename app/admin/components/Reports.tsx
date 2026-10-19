"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
} from "recharts";
import {
    Download,
    RefreshCw,
    Users,
    BookOpen,
    GraduationCap,
    Layers3,
    AlertCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";
import { WanderingEyes } from "@/components/ui/WanderingEyes";

type Student = {
    id: string;
    created_at: string;
};

type Course = {
    id: string;
    name: string;
};

type ReportData = {
    students: Student[];
    courses: Course[];
    yearCount: number;
    subjectCount: number;
};

const cardClass =
    "min-w-0 rounded-xl border border-foreground/10 bg-white p-4 dark:bg-[var(--card)] sm:p-5";

const tooltipStyle = {
    background: "#29262F",
    border: "1px solid #45404E",
    borderRadius: 12,
    color: "#fff",
};

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

            if (profileError) throw profileError;

            if (profile?.role !== "admin") {
                throw new Error(
                    "Only administrators can view these reports."
                );
            }

            const [
                { data: studentRows, error: studentError },
                { data: courseRows, error: courseError },
                { count: yearCount, error: yearError },
                { count: subjectCount, error: subjectError },
            ] = await Promise.all([
                supabase
                    .from("students")
                    .select("id, created_at")
                    .eq("admin_id", user.id),

                supabase
                    .from("courses")
                    .select("id, name")
                    .eq("admin_id", user.id)
                    .order("name"),

                supabase
                    .from("year_levels")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("admin_id", user.id),

                supabase
                    .from("subjects")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
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
        } catch (err: unknown) {
            console.error("Reports loading error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load reports. Please try again."
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

            const count = data.students.filter((student) => {
                const created = new Date(student.created_at);

                return (
                    !Number.isNaN(created.getTime()) &&
                    created.getFullYear() === date.getFullYear() &&
                    created.getMonth() === date.getMonth()
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

    const totalStudents = data.students.length;

    async function exportPDF() {
        setExporting(true);
        setError("");

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
                ],
                theme: "grid",
                headStyles: {
                    fillColor: [138, 117, 207],
                    textColor: 255,
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                },
            });

            const tableState = pdf as jsPDF & {
                lastAutoTable?: { finalY: number };
            };

            const nextY = (tableState.lastAutoTable?.finalY ?? 100) + 12;

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
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                },
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
            <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-5 overflow-x-hidden hide-scrollbar p-3 font-sans text-foreground sm:space-y-6 sm:p-5 lg:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-foreground/60 sm:mt-2">
                        Monitor student enrollment and academic records.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:shrink-0">
                    <button
                        type="button"
                        onClick={() => void loadReports()}
                        disabled={loading}
                        className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-foreground/15 px-3 py-2.5 text-sm transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                    >
                        <RefreshCw size={16} className="shrink-0" />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => void exportPDF()}
                        disabled={exporting || loading}
                        className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                    >
                        <Download size={16} className="shrink-0" />
                        <span className="truncate">
                            {exporting ? "Exporting..." : "Export PDF"}
                        </span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500 sm:p-4">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 break-words">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                <MetricCard
                    title="Total Students"
                    value={totalStudents}
                    description="Student records"
                    icon={<Users size={20} />}
                />
                <MetricCard
                    title="Total Courses"
                    value={data.courses.length}
                    description="Courses in your account"
                    icon={<GraduationCap size={20} />}
                />
                <MetricCard
                    title="Year Levels"
                    value={data.yearCount}
                    description="Configured year levels"
                    icon={<Layers3 size={20} />}
                />
                <MetricCard
                    title="Total Subjects"
                    value={data.subjectCount}
                    description="Configured subjects"
                    icon={<BookOpen size={20} />}
                />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                <section className={cardClass}>
                    <div className="mb-4 sm:mb-5">
                        <h2 className="font-semibold">Enrollment Trend</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            New student records over the last six months
                        </p>
                    </div>

                    <div className="h-60 w-full min-w-0 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={enrollmentTrend}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: -22,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    stroke="currentColor"
                                    strokeOpacity={0.1}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#9995A2", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    width={35}
                                    tick={{ fill: "#9995A2", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line
                                    type="monotone"
                                    dataKey="students"
                                    name="New students"
                                    stroke="#C9A0DC"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "#C9A0DC" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="mb-4 sm:mb-5">
                        <h2 className="font-semibold">Courses Overview</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            Courses configured in your account
                        </p>
                    </div>

                    {data.courses.length === 0 ? (
                        <EmptyChart message="No courses available yet." />
                    ) : (
                        <div className="space-y-3">
                            {data.courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex min-w-0 items-center gap-3 rounded-lg bg-foreground/[0.03] p-3"
                                >
                                    <GraduationCap
                                        size={18}
                                        className="shrink-0 text-[var(--primary)]"
                                    />
                                    <span
                                        className="min-w-0 flex-1 break-words text-sm"
                                        title={course.name}
                                    >
                                        {course.name}
                                    </span>
                                </div>
                            ))}
                            <p className="text-xs leading-relaxed text-foreground/50">
                                Student counts by course are unavailable
                                until the student-to-course relationship
                                column is identified.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <section className={cardClass}>
                <div className="mb-4 sm:mb-5">
                    <h2 className="font-semibold">Report Summary</h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Overview of the records currently available to your
                        account.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SummaryItem
                        label="Student records"
                        value={totalStudents}
                    />
                    <SummaryItem
                        label="Configured courses"
                        value={data.courses.length}
                    />
                    <SummaryItem
                        label="Configured year levels"
                        value={data.yearCount}
                    />
                    <SummaryItem
                        label="Configured subjects"
                        value={data.subjectCount}
                    />
                </div>
            </section>

            <p className="break-words text-xs leading-relaxed text-foreground/45">
                Reports reflect the student records currently available to
                your account. Enrollment trends use each record&apos;s
                creation date, which may differ from its official enrollment
                date.
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
    icon: ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-foreground/10 bg-white p-3 dark:bg-[var(--card)] sm:gap-3 sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                    <p className="break-words text-xs font-medium text-foreground/60 sm:text-sm">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="shrink-0 rounded-lg bg-[#C9A0DC]/15 p-2 text-[var(--primary)] sm:rounded-xl sm:p-3">
                    {icon}
                </div>
            </div>
            <p className="text-xs leading-relaxed text-foreground/50 sm:text-sm">
                {description}
            </p>
        </div>
    );
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="min-w-0 rounded-lg bg-foreground/[0.03] p-4">
            <p className="break-words text-sm text-foreground/60">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex h-60 flex-col items-center justify-center px-3 text-center sm:h-72">
            <BookOpen size={28} className="text-[var(--primary)]" />
            <p className="mt-3 max-w-sm text-sm text-foreground/60">
                {message}
            </p>
        </div>
    );
}
