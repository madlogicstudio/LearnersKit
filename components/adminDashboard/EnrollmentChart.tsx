"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

type EnrollmentData = {
    month: string;
    students: number;
};

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const numberFormatter = new Intl.NumberFormat("en-US");

export default function EnrollmentChart() {
    const [enrollmentData, setEnrollmentData] = useState<
        EnrollmentData[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchEnrollmentData() {
            setLoading(true);
            setError("");

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;
                if (!user) throw new Error("No authenticated user found.");

                const year = new Date().getFullYear();
                const startDate = `${year}-01-01T00:00:00.000Z`;
                const endDate = `${year + 1}-01-01T00:00:00.000Z`;

                const { data, error: queryError } = await supabase
                    .from("students")
                    .select("created_at")
                    .eq("admin_id", user.id)
                    .lt("created_at", endDate)
                    .order("created_at", { ascending: true });

                if (queryError) throw queryError;

                const monthlyCounts = Array(12).fill(0);

                // Starting population: students registered before this year.
                let cumulativeTotal = 0;

                data?.forEach((student) => {
                    if (!student.created_at) return;

                    const date = new Date(student.created_at);
                    const studentYear = date.getUTCFullYear();

                    if (studentYear < year) {
                        cumulativeTotal++;
                    } else if (studentYear === year) {
                        monthlyCounts[date.getUTCMonth()]++;
                    }
                });

                const currentMonth = new Date().getMonth();

                const chartData = months
                    .slice(0, currentMonth + 1)
                    .map((month, index) => {
                        cumulativeTotal += monthlyCounts[index];

                        return {
                            month,
                            students: cumulativeTotal,
                        };
                    });

                if (!cancelled) setEnrollmentData(chartData);
            } catch (err) {
                console.error("Enrollment chart error:", err);

                if (!cancelled) {
                    setError("Unable to load enrollment data.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchEnrollmentData();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-sans text-xl font-semibold text-foreground/80 dark:text-gray-100">
                        Student Enrollment
                    </h2>
                    <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
                        Cumulative enrollment throughout the year
                    </p>
                </div>

                <span className="rounded-md bg-[var(--primary)]/10 px-2.5 py-1 text-sm font-medium text-[var(--primary)]">
                    {new Date().getFullYear()}
                </span>
            </div>

            <div className="h-72 w-full">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        Loading enrollment data...
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-sm text-red-500">
                        {error}
                    </div>
                ) : enrollmentData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        No enrollment data available.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={enrollmentData}
                            margin={{
                                top: 8,
                                right: 12,
                                left: -12,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="currentColor"
                                className="text-foreground/10"
                            />

                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 14 }}
                                tickMargin={12}
                                stroke="#9ca3af"
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value: number) =>
                                    numberFormatter.format(value)
                                }
                                stroke="#9ca3af"
                                width={48}
                                allowDecimals={false}
                            />

                            <Tooltip
                                cursor={{
                                    stroke: "#94a3b8",
                                    strokeDasharray: "4 4",
                                }}
                                contentStyle={{
                                    borderRadius: "10px",
                                    border: "1px solid #e5e7eb",
                                    fontSize: "12px",
                                }}
                                formatter={(value) => [
                                    numberFormatter.format(Number(value)),
                                    "Students",
                                ]}
                                labelStyle={{
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    color: "#24232E",
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="students"
                                name="Students"
                                stroke="#8A75CF"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: "#8A75CF",
                                    stroke: "#ffffff",
                                    strokeWidth: 2,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--secondary)]" />
                Total registered students
            </div>
        </section>
    );
}
