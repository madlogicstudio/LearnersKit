"use client";

import { useState } from "react";
import { LogOut, Ellipsis, X } from "lucide-react";
import { useLogout } from "@/lib/hooks/useLogout";

export default function LogoutButton() {
    const { logout, loading, error } = useLogout();
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <>
            <div className="w-full">
                <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                    title="Logout"
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-[var(--primary)] px-4 py-3 font-sans text-white transition
                        hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-foreground/20"
                >
                    {loading ? (
                        <>
                            <Ellipsis size={20} />
                            <span className="text-sm">Logging out</span>
                        </>
                    ) : (
                        <>
                            <LogOut size={20} />
                            <span className="text-sm">Log out</span>
                        </>
                    )}
                </button>

                {error && (
                    <p role="alert" className="mt-2 text-sm text-red-500">
                        {error}
                    </p>
                )}
            </div>

            {showConfirm && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !loading) {
                            setShowConfirm(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-title"
                        aria-describedby="logout-description"
                        className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-6 shadow-2xl dark:bg-[var(--card)]"
                    >
                        <h2
                            id="logout-title"
                            className="text-lg font-semibold"
                        >
                            Log out of LearnersKit?
                        </h2>

                        <p
                            id="logout-description"
                            className="mt-2 text-sm leading-6 text-foreground/60"
                        >
                            Are you sure you want to log out? You will need to
                            sign in again to access your account.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row justify-between">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-50"
                            >
                                <X size={15} />
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void logout()}
                                disabled={loading}
                                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <Ellipsis size={16} />
                                ) : (
                                    <LogOut size={15} />
                                )}
                                {loading ? "Logging out..." : "Yes, log out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
