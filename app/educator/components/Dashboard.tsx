
"use client";

import { useEffect, useState } from "react";
import {
    Users,
    BookOpen,
    CalendarCheck,
    ClipboardList,
} from "lucide-react";
import { MdWavingHand } from "react-icons/md";
import { DashboardCard } from "./DashboardCard";
import { createClient } from "@/lib/supabase/client";

type DashboardCounts = {
    students: number;
    subjects: number;
    attendance: number;
    grades: number;
};

export default function Dashboard() {
    const [counts, setCounts] = useState<DashboardCounts>({
        students: 0,
        subjects: 0,
        attendance: 0,
        grades: 0,
    });

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

                // Get the educator's profile and linked admin.
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

                const [students, subjects, attendance, grades] =
                    await Promise.all([
                        supabase
                            .from("students")
                            .select("id", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", adminId),

                        supabase
                            .from("subjects")
                            .select("id", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", adminId),

                        supabase
                            .from("attendance")
                            .select("id", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", adminId),

                        supabase
                            .from("grades")
                            .select("id", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", adminId),
                    ]);

                const results = [
                    { name: "Students", result: students },
                    { name: "Subjects", result: subjects },
                    { name: "Attendance", result: attendance },
                    { name: "Grades", result: grades },
                ];

                for (const item of results) {
                    if (item.result.error) {
                        throw new Error(
                            `${item.name}: ${item.result.error.message}`
                        );
                    }
                }

                if (!cancelled) {
                    setEducatorName(
                        profile.full_name?.trim() || "Educator"
                    );

                    setCounts({
                        students: students.count ?? 0,
                        subjects: subjects.count ?? 0,
                        attendance: attendance.count ?? 0,
                        grades: grades.count ?? 0,
                    });
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
                if (!cancelled) setLoading(false);
            }
        }

        fetchDashboardData();

        return () => {
            cancelled = true;
        };
    }, []);

    const formatCount = (value: number) =>
        loading ? "..." : value.toLocaleString("en-US");

    return (
        <div className="h-full w-full overflow-auto hide-scrollbar p-3 flex flex-col sm:gap-6 gap-3">
            {/* Welcome header */}
            <div className="flex sm:flex-row flex-col sm:items-end items-start justify-between gap-3 px-3">
                <span className="flex flex-row items-center gap-3 text-lg text-foreground/80">
                    Good morning, {educatorName}!
                    <MdWavingHand
                        size={18}
                        className="text-[var(--primary)]"
                    />
                </span>

                <span className="text-md text-foreground/60 sm:mb-0 mb-3">
                    Here's an overview of your academic activities.
                </span>
            </div>

            {/* Error message */}
            {error && (
                <div
                    role="alert"
                    className="mx-3 rounded-xl border border-red-300/50 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <DashboardCard
                    title="My Students"
                    value={formatCount(counts.students)}
                    description="Students under your institution"
                    icon={Users}
                />

                <DashboardCard
                    title="My Subjects"
                    value={formatCount(counts.subjects)}
                    description="Available subjects"
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
            </div>

            {/* Additional dashboard sections can go here */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <CalendarCheck
                            size={20}
                            className="text-[var(--primary)]"
                        />
                        <h2 className="font-semibold text-foreground">
                            Attendance Overview
                        </h2>
                    </div>

                    <p className="text-sm text-foreground/60">
                        View attendance records and monitor student
                        attendance from the Attendance tab.
                    </p>
                </section>

                <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList
                            size={20}
                            className="text-[var(--primary)]"
                        />
                        <h2 className="font-semibold text-foreground">
                            Academic Records
                        </h2>
                    </div>

                    <p className="text-sm text-foreground/60">
                        Review and manage academic grades from the
                        Grades tab.
                    </p>
                </section>
            </div>
        </div>
    );
}
