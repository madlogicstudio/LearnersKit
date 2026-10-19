
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { EducatorNav } from "@/components/educatorDashboard/EducatorNav";
import { EducatorMobileMenu } from "@/components/educatorDashboard/EducatorMobileMenu";
import { AdminInviteModal } from "../components/AdminInviteModal";  
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/adminDashboard/UserProfile";

import Dashboard from "../components/Dashboard";
import Students from "../components/Students";
import Settings from "../components/Settings";

export default function Page() {
    const [isActive, setIsActive] = useState("dashboard");
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [needsInvite, setNeedsInvite] = useState(false);
    const [pageError, setPageError] = useState("");

    const checkEducatorProfile = useCallback(async () => {
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

            const { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("role, admin_id")
                    .eq("id", user.id)
                    .single();

            if (profileError) throw profileError;

            if (profile.role !== "educator") {
                window.location.replace("/login");
                return;
            }

            setNeedsInvite(!profile.admin_id);
        } catch (err) {
            console.error("Educator profile error:", err);

            setPageError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your educator profile."
            );
        } finally {
            setCheckingProfile(false);
        }
    }, []);

    useEffect(() => {
        void checkEducatorProfile();
    }, [checkEducatorProfile]);

    const handleInviteSuccess = async () => {
        await checkEducatorProfile();
    };

    if (checkingProfile) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#EFEFF4] dark:bg-[var(--border)]">
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                    Loading your educator workspace...
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="flex h-screen items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <h1 className="text-lg font-semibold">
                        Unable to load your workspace
                    </h1>
                    <p className="mt-2 text-sm text-red-500">
                        {pageError}
                    </p>
                    <button
                        onClick={() => void checkEducatorProfile()}
                        className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-white"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-row items-start justify-between gap-3 p-0 dark:bg-[var(--border)] sm:h-screen sm:p-3">
            {needsInvite && (
                <AdminInviteModal
                    onSuccess={handleInviteSuccess}
                />
            )}

            <div className="hidden h-full sm:flex">
                <EducatorNav
                    isActive={isActive}
                    setIsActive={setIsActive}
                />
            </div>

            <div className="flex min-h-screen flex-1 flex-col items-start justify-start p-0 sm:h-full sm:min-h-0 sm:p-3">
                <div className="flex w-full items-center justify-between gap-3 p-3">
                    <div className="flex sm:hidden">
                        <EducatorMobileMenu
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
                    {!needsInvite && isActive === "dashboard" && (
                        <Dashboard />
                    )}

                    {!needsInvite && isActive === "students" && (
                        <Students />
                    )}
                    {!needsInvite && isActive === "settings" && (
                        <Settings />
                    )}
                </div>
            </div>
        </div>
    );
}
