"use client";

import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

type DepartmentData = {
    department: string;
    classes: number;
};

type CourseRow = {
    department_id: string | null;
};

type DepartmentRow = {
    id: string;
    name: string;
};

const COLORS = [
    "#5578C9",
    "#96B4EB",
    "#D789B9",
    "#F6E06E",
    "#75B798",
];

const numberFormatter = new Intl.NumberFormat("en-US");

export default function ActiveClassesChart() {
    const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchActiveClasses() {
            setLoading(true);
            setError("");

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;
                if (!user) throw new Error("No authenticated user found.");

                const [coursesResult, departmentsResult] = await Promise.all([
                    supabase
                        .from("courses")
                        .select("department_id")
                        .eq("admin_id", user.id),

                    supabase
                        .from("departments")
                        .select("id, name")
                        .eq("admin_id", user.id),
                ]);

                if (coursesResult.error) throw coursesResult.error;
                if (departmentsResult.error) throw departmentsResult.error;

                const courses = (coursesResult.data ?? []) as CourseRow[];
                const departments = (departmentsResult.data ?? []) as DepartmentRow[];

                const departmentNames = new Map(
                    departments.map((department) => [
                        department.id,
                        department.name,
                    ])
                );

                const counts = new Map<string, number>();

                courses.forEach((course) => {
                    const departmentName = course.department_id
                        ? departmentNames.get(course.department_id) ?? "Other"
                        : "Unassigned";

                    counts.set(
                        departmentName,
                        (counts.get(departmentName) ?? 0) + 1
                    );
                });

                const chartData = Array.from(
                    counts,
                    ([department, classes]) => ({
                        department,
                        classes,
                    })
                ).sort((a, b) => b.classes - a.classes);

                if (!cancelled) setDepartmentData(chartData);
            } catch (err) {
                console.error("Active classes chart error:", err);

                if (!cancelled) {
                    setError("Unable to load class distribution.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchActiveClasses();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalClasses = departmentData.reduce(
        (total, item) => total + item.classes,
        0
    );

    return (
        <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground/80 dark:text-gray-100">
                    Courses by Department
                </h2>
                <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
                    Distribution across departments
                </p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                    Loading course distribution...
                </div>
            ) : error ? (
                <div className="flex h-64 items-center justify-center text-sm text-red-500">
                    {error}
                </div>
            ) : (
                <>
                    <div className="relative h-64 w-full">
                        {totalClasses > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={departmentData}
                                            dataKey="classes"
                                            nameKey="department"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {departmentData.map((entry, index) => (
                                                <Cell
                                                    key={entry.department}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value, _name, item) => [
                                                `${numberFormatter.format(Number(value))} courses`,
                                                item.payload.department,
                                            ]}
                                            contentStyle={{
                                                borderRadius: "10px",
                                                border: "1px solid #e5e7eb",
                                                fontSize: "12px",
                                                backgroundColor:
                                                    "var(--tooltip-bg, #ffffff)",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                        {numberFormatter.format(totalClasses)}
                                    </span>
                                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Total Courses
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                No courses available yet.
                            </div>
                        )}
                    </div>

                    <div className="mt-5 space-y-3">
                        {departmentData.map((item, index) => {
                            const percentage =
                                totalClasses > 0
                                    ? (item.classes / totalClasses) * 100
                                    : 0;

                            return (
                                <div
                                    key={item.department}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    COLORS[index % COLORS.length],
                                            }}
                                        />
                                        <span className="truncate text-sm text-gray-600 dark:text-gray-300">
                                            {item.department}
                                        </span>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.classes}
                                        </span>
                                        <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}
