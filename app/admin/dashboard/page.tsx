'use client'

import LogoutButton from "@/components/dashboard/LogoutButton"
import { AdminNav } from "@/components/dashboard/AdminNav"
import { AdminMobileMenu } from "@/components/dashboard/AdminMobileMenu"
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { Search } from "lucide-react";
import Dashboard from "../components/Dashboard";
import Students from "../components/Students";

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
                    <div className="flex-1 flex flex-row items-center gap-3 max-w-[600px] w-full border border-foreground/20 px-3 py-2 rounded-full">
                        <Search size={18} className="text-foreground/80 cursor-pointer" />
                        <input type="text" placeholder="Search for students, classes, records ..."
                            className="w-full outline-none text-sm" />
                    </div>
                    <div className="ml-auto sm:flex hidden flex-row items-center gap-3">
                        <ThemeToggle />
                        <UserProfile />
                        <LogoutButton />
                    </div>
                </div>
                
                <div className="flex-1 w-full flex flex-col overflow-hidden rounded-lg shadow-xl">
                    {isActive === "dashboard" && <Dashboard />}
                    {isActive === "students" && <Students />}
                </div>

            </div>

        </div>
    )
}

export default page