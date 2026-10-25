"use client";

import { useState } from "react";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminInviteModalProps = {
    onSuccess: () => void;
};

export function AdminInviteModal({
    onSuccess,
}: AdminInviteModalProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");

        const normalizedCode = code.trim().toUpperCase();

        if (!normalizedCode) {
            setError("Please enter an invite code.");
            return;
        }

        setLoading(true);

        try {
            
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setError("Your session has expired. Please sign in again.");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, email, role, admin_id")
                .eq("id", user.id)
                .maybeSingle();

            console.log("Authenticated user:", {
                id: user.id,
                email: user.email,
            });

            console.log("Authenticated profile:", profile);
            console.log("Profile query error:", profileError);

            if (profileError || !profile) {
                setError("We couldn't find your account profile. Please try again.");
                return;
            }

            if (!["educator", "student"].includes(profile.role)) {
                setError("Your account must have an educator or student role.");
                return;
            }


            const { error: inviteError } = await supabase.rpc(
                "accept_admin_invite_code",
                {
                    invite_code: normalizedCode,
                }
            );

            if (inviteError) {
                console.error(
                    "Error accepting administrator invite:",
                    inviteError
                );

                const message = inviteError.message.toLowerCase();

                if (message.includes("invalid") ||
                    message.includes("expired") ||
                    message.includes("inactive")) {
                    setError(
                        "This invite code is invalid, expired, or inactive."
                    );
                } else if (message.includes("already linked")) {
                    setError(
                        "Your account is already connected to an institution."
                    );
                } else if (message.includes("signed in")) {
                    setError(
                        "Your session has expired. Please sign in again."
                    );
                } else {
                    setError(
                        "We couldn't connect your account. Please try again."
                    );
                }

                return;
            }

            // The RPC should link the profile and create the teacher
            // record in the database before returning successfully.
            setCode("");
            onSuccess();
        } catch (err) {
            console.error("Unexpected invite code error:", err);

            setError(
                "Something went wrong while connecting your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="invite-title"
                className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-[var(--card)] sm:p-8"
            >
                <div className="mb-6 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                        <KeyRound size={27} />
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <h2
                        id="invite-title"
                        className="text-lg font-semibold text-foreground"
                    >
                        Connect to Your Institution
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-foreground/60">
                        Enter the educator invite code provided by your
                        administrator to connect your account and access
                        your academic workspace.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="invite-code"
                            className="mb-2 block text-sm font-medium text-foreground"
                        >
                            Administrator Invite Code
                        </label>

                        <input
                            id="invite-code"
                            type="text"
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value.toUpperCase());
                                if (error) setError("");
                            }}
                            placeholder="Enter your invite code"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-60 dark:bg-[var(--card)]"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <LoaderCircle
                                    size={18}
                                    className="animate-spin"
                                />
                                Connecting account...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                Verify and Continue
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-5 flex items-start gap-2 rounded-lg bg-purple-50 p-3 text-sm leading-5 text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
                    <ShieldCheck
                        size={16}
                        className="mt-0.5 shrink-0"
                    />
                    <p>
                        Your account will be linked to the institution
                        associated with this code.
                    </p>
                </div>
            </div>
        </div>
    );
}