'use client'

import { Grid2X2, Users, Square, ChartPie, BookOpen, Settings, LogOut, GraduationCap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import LogoutButton from "../ui/LogoutButton"
import AdminInviteCode from "./AdminInviteCode"

type AdminNavProps = {
    isActive: string;
    setIsActive: React.Dispatch<React.SetStateAction<string>>;
}

export const AdminNav = ({isActive, setIsActive}: AdminNavProps) => {
    return (
        <section className="font-sans h-full sm:flex hidden flex-col items-center justify-start py-6 px-4 gap-12 rounded-lg shadow-xl
            bg-white shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">

            <div className="fadeIn flex flex-row items-center gap-3">
                <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                <Link href="/" className="font-sans sm:text-lg text-md tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link>               
            </div>
            
            <AdminInviteCode />

            <div className="fadeIn w-full flex flex-col items-start justify-center gap-3 text-sm">

                <span className="text-foreground/60 text-md px-3">Workspace</span>
                <button className={`${isActive === "dashboard" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("dashboard")}>
                    <Grid2X2 size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Dashboard</span>
                </button>
                <button className={`${isActive === "students" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("students")}>
                    <Users size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Students</span>
                </button>
                <button className={`${isActive === "teachers" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("teachers")}>
                    <GraduationCap size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Teachers</span>
                </button>
                <button className={`${isActive === "courses" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("courses")}>
                    <Square size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Courses</span>
                </button>
                <button className={`${isActive === "subjects" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("subjects")}>
                    <BookOpen size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Subjects</span>
                </button>
                <button className={`${isActive === "reports" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("reports")}>
                    <ChartPie size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Reports</span>
                </button>
                
            </div>

            <div className="fadeIn mt-auto w-full flex flex-col items-start gap-3 text-sm">

                <span className="text-foreground/60 text-md px-3">Account</span>
                <button className={`${isActive === "settings" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("settings")}>
                    <Settings size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Settings</span>
                </button>
                <LogoutButton />

            </div>

        </section>
    )
}
