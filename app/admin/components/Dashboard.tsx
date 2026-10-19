"use client";

import { useEffect, useState } from "react";
import {
    Users,
    GraduationCap,
    BookOpen,
    UserCheck,
} from "lucide-react";
import { MdWavingHand } from "react-icons/md";
import { DashboardCard } from "./DashboardCard";
import EnrollmentChart from "@/components/adminDashboard/EnrollmentChart";
import ActiveClassesChart from "@/components/adminDashboard/ActiveClassesChart";
import { createClient } from "@/lib/supabase/client";

type DashboardCounts = {
    students: number;
    teachers: number;
    courses: number;
    subjects: number;
};

export default function Dashboard() {
    const [counts, setCounts] = useState<DashboardCounts>({
        students: 0,
        teachers: 0,
        courses: 0,
        subjects: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchDashboardCounts() {
            setLoading(true);

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    throw new Error("No authenticated user found.");
                }

                const [students, teachers, courses, subjects] =
                    await Promise.all([
                        supabase
                            .from("students")
                            .select("*", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", user.id),

                        supabase
                            .from("teachers")
                            .select("*", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", user.id),

                        supabase
                            .from("courses")
                            .select("*", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", user.id),

                        supabase
                            .from("subjects")
                            .select("*", {
                                count: "exact",
                                head: true,
                            })
                            .eq("admin_id", user.id),
                    ]);

                const results = [
                    { name: "students", result: students },
                    { name: "teachers", result: teachers },
                    { name: "courses", result: courses },
                    { name: "subjects", result: subjects },
                ];

                for (const item of results) {
                    if (item.result.error) {
                        throw new Error(
                            `${item.name}: ${item.result.error.message}`
                        );
                    }
                }

                if (!cancelled) {
                    setCounts({
                        students: students.count ?? 0,
                        teachers: teachers.count ?? 0,
                        courses: courses.count ?? 0,
                        subjects: subjects.count ?? 0,
                    });
                }
            } catch (error) {
                console.error("Dashboard count error:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchDashboardCounts();

        return () => {
            cancelled = true;
        };
    }, []);

    const formatCount = (value: number) =>
        loading ? "..." : value.toLocaleString("en-US");

    return (
        <div className="h-full w-full overflow-auto hide-scrollbar p-3 flex flex-col sm:gap-6 gap-3">
            <div className="flex sm:flex-row flex-col sm:items-end items-start justify-between gap-3 px-3">
                <span className="flex flex-row items-center gap-3 text-lg text-foreground/80">
                    Good morning, Admin!
                    <MdWavingHand
                        size={18}
                        className="text-[var(--primary)]"
                    />
                </span>

                <span className="text-md text-foreground/60 sm:mb-0 mb-3">
                    Here's what's happening today.
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <DashboardCard
                    title="Total Students"
                    value={formatCount(counts.students)}
                    description="Registered students"
                    icon={Users}
                />

                <DashboardCard
                    title="Total Teachers"
                    value={formatCount(counts.teachers)}
                    description="Registered teaching staff"
                    icon={GraduationCap}
                />

                <DashboardCard
                    title="Total Classes"
                    value={formatCount(counts.courses)}
                    description="Registered courses"
                    icon={BookOpen}
                />

                <DashboardCard
                    title="Total Subjects"
                    value={formatCount(counts.subjects)}
                    description="Registered subjects"
                    icon={UserCheck}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <EnrollmentChart />
                <ActiveClassesChart />
            </div>
        </div>
    );
}
