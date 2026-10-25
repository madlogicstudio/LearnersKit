'use client'

import { Grid2X2, Users, Square, ChartPie, BookOpen, Settings, LogOut, GraduationCap, ClipboardCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import LogoutButton from "../ui/LogoutButton"

type StudentNavProps = {
    isActive: string;
    setIsActive: React.Dispatch<React.SetStateAction<string>>;
}

export const StudentNav = ({isActive, setIsActive}: StudentNavProps) => {
    return (
        <section className="font-sans h-full sm:flex hidden flex-col items-center justify-start py-6 px-4 gap-12 rounded-lg shadow-xl
            bg-white shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">

            <div className="fadeIn flex flex-row items-center gap-3">
                <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                <Link href="/" className="font-sans sm:text-lg text-md tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link>               
            </div> 

            <div className="fadeIn w-full flex flex-col items-start justify-center gap-3 text-sm">

                <span className="text-foreground/60 text-md px-3">Workspace</span>
                <button className={`${isActive === "dashboard" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("dashboard")}>
                    <Grid2X2 size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Dashboard</span>
                </button>
                <button className={`${isActive === "subjects" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("subjects")}>
                    <BookOpen size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Subjects</span>
                </button>
                <button className={`${isActive === "attendance" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("attendance")}>
                    <ClipboardCheck size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Attendance</span>
                </button>
                <button className={`${isActive === "grades" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("grades")}>
                    <GraduationCap size={30} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Grades</span>
                </button>
                <button className={`${isActive === "academic-records" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("academic-records")}>
                    <ChartPie size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Academic Records</span>
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
