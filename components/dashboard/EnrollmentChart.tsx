"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,  
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type EnrollmentData = {
    month: string;
    students: number;
};

const enrollmentData: EnrollmentData[] = [
    { month: "Jan", students: 300 },
    { month: "Feb", students: 450 },
    { month: "Mar", students: 600 },
    { month: "Apr", students: 680 },
    { month: "May", students: 780 },
    { month: "Jun", students: 860 },
    { month: "Jul", students: 920 },
    { month: "Aug", students: 1020 },
    { month: "Sep", students: 1080 },
    { month: "Oct", students: 1130 },
    { month: "Nov", students: 1200 },
    { month: "Dec", students: 1260 },
];

const numberFormatter = new Intl.NumberFormat("en-US");

export default function EnrollmentChart() {
    return (
        <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                <h2 className="font-sans text-xl font-semibold text-foreground/80 dark:text-gray-100">
                    Student Enrollment
                </h2>
                <p className="font-sans mt-1 text-md text-gray-500 dark:text-gray-400">
                    Enrollment overview throughout the year
                </p>
                </div>

                <span className="rounded-md bg-[var(--primary)]/10 px-2.5 py-1 text-sm font-medium text-[var(--primary)]">
                    This year   
                </span>
            </div>

            <div className="h-72 w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={enrollmentData}
                    margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                    <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-800"
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
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--secondary)]" />
                Total student enrollment
            </div>
        </section>
    );
}
