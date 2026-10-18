'use client'

import LogoutButton from "@/components/adminDashboard/LogoutButton"
import { AdminNav } from "@/components/adminDashboard/AdminNav"
import { AdminMobileMenu } from "@/components/adminDashboard/AdminMobileMenu"
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/adminDashboard/UserProfile";
import { Search } from "lucide-react";
import Dashboard from "../components/Dashboard";
import Students from "../components/Students";
import Teachers from "../components/Teachers";
import Courses from "../components/Courses";
import Subjects from "../components/Subjects";
import Reports from "../components/Reports";
import Settings from "../components/Settings";

function page() {

    const [isActive, setIsActive] = useState("students");

    return (
        <div className="sm:h-screen h-auto w-full flex flex-row items-start justify-between gap-3 sm:p-3 p-0 dark:bg-[var(--border)]">
            
            <div className="h-full sm:flex hidden">
                <AdminNav isActive={isActive} setIsActive={setIsActive} />
            </div>
            
            <div className="h-full flex-1 flex flex-col items-start justify-start sm:p-3 p-0">

                <div className="w-full flex flex-row items-center justify-between p-3 gap-3">
                    <div className="sm:hidden flex">
                        <AdminMobileMenu isActive={isActive} setIsActive={setIsActive} />
                    </div>
                    <div className="bg-white dark:bg-[var(--card)] sm:flex hidden flex-row gap-2 px-6 py-2 rounded-full">
                        <span className="text-sm">Something new is on the way.</span>
                        <span className="text-sm">We're working on improvements to make managing student records easier. Stay tuned for the next LearnersKit update.</span>
                        <span className="text-sm underline cursor-pointer text-[var(--primary)]">Learn more...</span>
                    </div>
                    <div className="ml-auto sm:flex hidden flex-row items-center gap-3">
                        <ThemeToggle />
                        <UserProfile />
                    </div>
                    <div className="ml-auto flex sm:hidden flex-row items-center gap-3">
                        <UserProfile />
                    </div>
                </div>
                
                <div className="flex-1 w-full flex flex-col overflow-hidden rounded-lg shadow-xl">
                    {isActive === "dashboard" && <Dashboard />}
                    {isActive === "students" && <Students />}
                    {isActive === "teachers" && <Teachers />}
                    {isActive === "courses" && <Courses />}
                    {isActive === "subjects" && <Subjects />}
                    {isActive === "reports" && <Reports />}
                    {isActive === "settings" && <Settings />}
                </div>

            </div>

        </div>
    )
}

export default page