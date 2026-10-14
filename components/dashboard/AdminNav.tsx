'use client'

import { Grid2X2, Users, Square, ChartPie, BookOpen, Settings, LogOut, GraduationCap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import React from "react"

type AdminNavProps = {
    isActive: string;
    setIsActive: React.Dispatch<React.SetStateAction<string>>;
}

export const AdminNav = ({isActive, setIsActive}: AdminNavProps) => {
    return (
        <section className="font-sans h-full sm:flex hidden flex-col items-center justify-between py-6 px-4 gap-3 rounded-lg shadow-xl
            bg-white shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">

            <div className="fadeIn flex flex-row items-center gap-3">
                <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                <Link href="/" className="font-sans sm:text-lg text-md tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link>               
            </div> 

            <div className="fadeIn w-full flex-1 flex flex-col items-center justify-center gap-3 text-sm">

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
                <button className={`${isActive === "classes" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("classes")}>
                    <Square size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Classes</span>
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

            <div className="fadeIn w-full flex flex-col items-center gap-3 text-sm">
                <button className={`${isActive === "settings" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("settings")}>
                    <Settings size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Settings</span>
                </button>
                <button className={`${isActive === "logout" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                    w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                    onClick={() => setIsActive("logout")}>
                    <LogOut size={26} className="text-[var(--primary)]"/>
                    <span className="text-foreground/80">Logout</span>
                </button>
            </div>

        </section>
    )
}
