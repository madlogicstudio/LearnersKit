
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentNav } from "@/components/studentDashboard/StudentNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/adminDashboard/UserProfile";
import { StudentMobileMenu } from "@/components/studentDashboard/StudentMobileMenu";
import StudentClaimModal from "../components/StudentClaimModal";
import Settings from "../components/Settings";
import Dashboard from "../components/Dashboard";

export default function Page() {
    const [isActive, setIsActive] = useState("dashboard");
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [needsClaimCode, setNeedsClaimCode] = useState(false);
    const [pageError, setPageError] = useState("");

    const checkStudentProfile = useCallback(async () => {
        const supabase = createClient();

        setCheckingProfile(true);
        setPageError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                window.location.replace("/login");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role, admin_id")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            if (profile.role !== "student") {
                window.location.replace("/login");
                return;
            }

            setNeedsClaimCode(!profile.admin_id);
        } catch (err) {
            console.error("Student profile error:", err);

            setPageError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your student profile."
            );
        } finally {
            setCheckingProfile(false);
        }
    }, []);

    useEffect(() => {
        void checkStudentProfile();
    }, [checkStudentProfile]);

    if (checkingProfile) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-foreground/10 border-t-[var(--primary)]" />
                    <p className="text-sm text-foreground/60">
                        Loading your student workspace...
                    </p>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
                <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-6 text-center shadow-sm dark:bg-[var(--card)]">
                    <h1 className="text-lg font-semibold">
                        Unable to load your workspace
                    </h1>

                    <p className="mt-2 break-words text-sm text-red-500">
                        {pageError}
                    </p>

                    <button
                        onClick={() => void checkStudentProfile()}
                        className="mt-5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-row items-start justify-between gap-3 p-0 dark:bg-[var(--border)] sm:h-screen sm:p-3">
            {needsClaimCode && (
                <StudentClaimModal
                    onSuccess={checkStudentProfile}
                />
            )}

            <div className="hidden h-full sm:flex">
                <StudentNav
                    isActive={isActive}
                    setIsActive={setIsActive}
                />
            </div>

            <div className="flex min-h-screen flex-1 flex-col items-start justify-start p-0 sm:h-full sm:min-h-0 sm:p-3">
                <div className="flex w-full items-center justify-between gap-3 p-3">
                    <div className="flex sm:hidden">
                        <StudentMobileMenu
                            isActive={isActive}
                            setIsActive={setIsActive}
                        />
                    </div>

                    <div className="hidden flex-row gap-2 rounded-full bg-white px-6 py-2 dark:bg-[var(--card)] sm:flex">
                        <span className="text-sm">
                            Something new is on the way.
                        </span>
                        <span className="text-sm">
                            We're working on improvements to make managing
                            student records easier. Stay tuned for the next
                            LearnersKit update.
                        </span>
                        <span className="cursor-pointer text-sm text-[var(--primary)] underline">
                            Learn more...
                        </span>
                    </div>

                    <div className="ml-auto hidden items-center gap-3 sm:flex">
                        <ThemeToggle />
                        <UserProfile />
                    </div>

                    <div className="ml-auto flex items-center gap-3 sm:hidden">
                        <UserProfile />
                    </div>
                </div>

                <div className="flex w-full flex-1 flex-col overflow-hidden rounded-lg shadow-xl">
                    {!needsClaimCode && isActive === "dashboard" && (
                        <Dashboard />
                    )}

                    {!needsClaimCode && isActive === "settings" && (
                        <Settings />
                    )}
                </div>
            </div>
        </div>
    );
}
