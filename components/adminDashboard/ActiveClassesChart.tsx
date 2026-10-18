
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DepartmentData = {
  department: string;
  classes: number;
};

const departmentData: DepartmentData[] = [
  { department: "Information Technology", classes: 9 },
  { department: "Business Administration", classes: 6 },
  { department: "Engineering", classes: 5 },
  { department: "Others", classes: 4 },
];

const COLORS = [
  "#5578C9",
  "#96B4EB",
  "#D789B9",
  "#F6E06E",
  "#75B798",
];

const numberFormatter = new Intl.NumberFormat("en-US");

export default function ActiveClassesChart() {
    const totalClasses = departmentData.reduce(
        (total, item) => total + item.classes,
        0
    );

    return (
        <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground/80 dark:text-gray-100">
                    Active Classes
                </h2>
                <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
                    Distribution across departments
                </p>
            </div>

            <div className="relative h-64 w-full">
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
                        `${numberFormatter.format(Number(value))} classes`,
                        item.payload.department,
                    ]}
                    contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                        backgroundColor: "var(--tooltip-bg, #ffffff)",
                    }}
                    />
                </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {numberFormatter.format(totalClasses)}
                </span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Total Classes
                </span>
                </div>
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
                            backgroundColor: COLORS[index % COLORS.length],
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
        </section>
    );
}
