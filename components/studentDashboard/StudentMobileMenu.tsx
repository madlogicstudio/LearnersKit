'use client'

import { useState, useRef } from "react"
import { Menu, X } from "lucide-react"
import { RiHome9Fill, RiUser3Fill, RiLayoutGridFill, RiBarChart2Fill } from "react-icons/ri"
import { PiGearSixFill } from "react-icons/pi"
import LogoutButton from "../ui/LogoutButton"
import Image from "next/image"
import Link from "next/link"
import { Grid2X2, Users, Square, ChartPie, BookOpen, Settings, LogOut, GraduationCap } from "lucide-react"
import { ThemeToggle } from "../ui/ThemeToggle"
import { UserProfile } from "../adminDashboard/UserProfile"

type StudentMobileMenuProps = {
    isActive: string;
    setIsActive: React.Dispatch<React.SetStateAction<string>>;
}

export const StudentMobileMenu = ({isActive, setIsActive}: StudentMobileMenuProps) => {

    const [navOpen, setNavOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <div className="font-sans w-full flex flex-row items-center justify-start gap-3 sm:p-2 p-0">
            <div className="bg-[var(--primary)]/60 transition duration-300 ease cursor-pointer text-white
                items-center gap-3 rounded-lg p-2 sm:hidden flex">
                <Menu size={18} onClick={() => setNavOpen(true)}/>
            </div>

            <div ref={menuRef} className={`w-full h-screen lg:hidden flex flex-col items-start justify-start gap-3 
                bg-background dark:bg-[var(--card)] fixed top-0 left-0 transition-transform duration-300 p-3 z-10 
                ${navOpen ? "translate-x-0" : "-translate-x-full"}
                ${!navOpen ? "-translate-x-full" : "translate-x-0"}`}>
                
                <div className="h-full w-full flex flex-col items-start gap-12 ">

                    <div className="flex flex-row items-center gap-3 items-end">
                        <div className="bg-[var(--primary)]/80 transition duration-300 ease cursor-pointer text-white
                            items-center gap-3 rounded-lg p-2 sm:hidden flex">
                            <X size={18} onClick={() => setNavOpen(false)}/>
                        </div>
                        <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                        <Link href="/" className="font-sans text-lg tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link>   
                    </div>

                    <div className="fadeIn w-full flex flex-col items-start justify-center gap-3 text-sm">

                        <span className="text-foreground/60 text-md px-3">Workspace</span>
                        <button className={`${isActive === "dashboard" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("dashboard");
                                setNavOpen(false);
                            }}>
                            <Grid2X2 size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Dashboard</span>
                        </button>
                        <button className={`${isActive === "subjects" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("subjects");
                                setNavOpen(false);
                            }}>
                            <Users size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Subjects</span>
                        </button>
                        <button className={`${isActive === "attendance" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("attendance");
                                setNavOpen(false);
                            }}>
                            <GraduationCap size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Attendance</span>
                        </button>
                        <button className={`${isActive === "grades" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("grades");
                                setNavOpen(false);
                            }}>
                            <Square size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Grades</span>
                        </button>
                        <button className={`${isActive === "academic-records" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("academic-records");
                                setNavOpen(false);
                            }}>
                            <BookOpen size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Academic Records</span>
                        </button>
                        
                    </div>

                    <div className="mt-auto fadeIn w-full flex flex-col items-start gap-3 text-sm">
                        <span className="text-foreground/60 text-md px-3">Account</span>
                        <button className={`${isActive === "settings" ? "bg-[var(--accent)] dark:bg-foreground/10" : ""}
                            w-full hover:bg-foreground/10 px-3 py-2 rounded-lg transition cursor-pointer flex flex-row items-center gap-3`}
                            onClick={() => {
                                setIsActive("settings");
                                setNavOpen(false);
                            }}>
                            <Settings size={26} className="text-[var(--primary)]"/>
                            <span className="text-foreground/80">Settings</span>
                        </button>
                        <LogoutButton />
                    </div>
                    
                </div>
                
                
            </div>  

        </div>
    )
}
