"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function page() {

    const supabase = createClient();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session && event === "SIGNED_IN") {
                    const { data: profile, error } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    if (error || !profile) {
                        console.error("Failed to fetch user role:", error);
                        return;
                    }

                    switch (profile.role) {
                        case "admin":
                            window.location.replace("/admin/dashboard");
                            break;

                        case "educator":
                            window.location.replace("/educator/dashboard");
                            break;

                        case "student":
                            window.location.replace("/student/dashboard");
                            break;

                        default:
                            window.location.replace("/login");
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <section className="fadeIn h-screen w-full flex flex-col items-center justify-center sm:p-24 p-0 bg-[var(--background)] gap-3">
            
            <div className="font-sans h-full lg:max-w-[1280px] w-full rounded-xl bg-white/10 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5
                flex flex-row-reverse items-center">

                <div className="flex-1 h-full sm:flex hidden flex-col items-center justify-center gap-3 bg-[var(--accent)] dark:bg-[var(--secondary)] rounded-xl rounded-l-none">

                    <Image src="/images/Signup-image.svg" height={480} width={480} alt="Login Illustration" className="" loading="eager" />

                    <span className="mt-12 text-3xl text-foreground">Your academic journey starts here.</span>
                    <span className="max-w-[480px] text-lg text-foreground text-center">One secure place for student information and academic records.</span>

                </div>

                <div className="flex-1 h-full bg-white dark:bg-[var(--background)]/10 flex flex-col items-center justify-center rounded-xl rounded-r-none">

                    <div className="sm:max-w-[360px] w-full flex flex-col items-center justify-center gap-6 my-12 sm:px-0 px-3">

                        <span className="sm:text-lg text-md font-foreground/80 text-center mb-12">Choose a role that you wanted to sign up.</span>

                        <Link href="/signup/admin" className="flex flex-row items-center justify-center w-full p-3 cursor-pointer
                            bg-[var(--accent)] hover:bg-[#24232E] dark:hover:bg-[var(--secondary)] text-[#24232E] hover:text-[#EFEFF4] transition rounded-lg">
                            <span className="text-md">Admin</span>
                        </Link>
                        <Link href="/signup/educator" className="flex flex-row items-center justify-center w-full p-3 cursor-pointer
                            bg-[var(--accent)] hover:bg-[#24232E] dark:hover:bg-[var(--secondary)] text-[#24232E] hover:text-[#EFEFF4] transition rounded-lg">
                            <span className="text-md">Educator</span>
                        </Link>
                        <Link href="/signup/student" className="flex flex-row items-center justify-center w-full p-3 cursor-pointer
                            bg-[var(--accent)] hover:bg-[#24232E] dark:hover:bg-[var(--secondary)] text-[#24232E] hover:text-[#EFEFF4] transition rounded-lg">
                            <span className="text-md">Student</span>
                        </Link>

                    </div>

                    <p className="font-sans mt-3 text-center text-md text-foreground/80">
                        Already have an account?{" "}
                        <Link href="/login" className="ml-1 font-bold text-[var(--primary)]/80 transition hover:text-[var(--secondary)]">
                            Login
                        </Link>
                    </p>

                </div>

            </div>

        </section>  
    )
}

export default page