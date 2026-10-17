"use client";

import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { MdWavingHand } from "react-icons/md";
import { DashboardCard } from "./DashboardCard";
import EnrollmentChart from "@/components/dashboard/EnrollmentChart";
import ActiveClassesChart from "@/components/dashboard/ActiveClassesChart";

function Dashboard() {
    return (
        <div className="h-full w-full overflow-auto hide-scrollbar p-3 flex flex-col sm:gap-6 gap-3 ">
            <div className="flex sm:flex-row flex-col sm:items-start sm:items-end items-start justify-between gap-3 px-3">

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
                    value="1,248"
                    description="+12% from last month"
                    icon={Users}
                />

                <DashboardCard
                    title="Total Teachers"
                    value="32"
                    description="Active teaching staff"
                    icon={GraduationCap}
                />

                <DashboardCard
                    title="Total Classes"
                    value="24"
                    description="Across all departments"
                    icon={BookOpen}
                />

                <DashboardCard
                    title="Total Subjects"   
                    value="12"
                    description="Across all classes "
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

export default Dashboard;
