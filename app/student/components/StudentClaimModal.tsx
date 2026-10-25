"use client";

import { useState } from "react";
import { KeyRound, LoaderCircle, X, ShieldCheck, AlertCircle } from "lucide-react";

type StudentClaimModalProps = {
    onSuccess: () => void | Promise<void>;
};

export default function StudentClaimModal({
    onSuccess,
}: StudentClaimModalProps) {
    const [claimCode, setClaimCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const normalizedCode = claimCode.trim();

        if (!normalizedCode) {
            setError("Please enter your claim code.");
            return;
        }

        setLoading(true);

        try {
            // This server action must validate the claim code securely.
            const { redeemStudentClaimCode } = await import(
                "@/lib/actions/studentClaimCode"
            );

            await redeemStudentClaimCode(normalizedCode);

            setSuccess(true);
            await onSuccess();
        } catch (err) {
            console.error("Student claim error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to verify your claim code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-claim-title"
                className="relative w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-6 shadow-2xl dark:bg-[var(--card)] sm:p-8"
            >
                <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--secondary)] dark:bg-foreground/10">
                            <KeyRound size={23} />
                        </div>

                        <div>
                            <h2
                                id="student-claim-title"
                                className="text-xl font-bold text-foreground"
                            >
                                Claim Your Student Record
                            </h2>
                            <p className="mt-1 text-sm text-foreground/60">
                                Enter the claim code provided by your school administrator.
                            </p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                        <ShieldCheck
                            size={36}
                            className="mx-auto mb-3 text-emerald-600"
                        />
                        <h3 className="font-semibold text-foreground">
                            Student record linked!
                        </h3>
                        <p className="mt-2 text-sm text-foreground/65">
                            Your student account has been linked successfully.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="student-claim-code"
                                className="mb-2 block text-md font-medium text-foreground"
                            >
                                Student claim code
                            </label>

                            <input
                                id="student-claim-code"
                                type="text"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                value={claimCode}
                                onChange={(event) => {
                                    setClaimCode(event.target.value);
                                    if (error) setError("");
                                }}
                                placeholder="Enter your claim code"
                                disabled={loading}
                                required
                                className="w-full text-sm rounded-xl border border-foreground/20 bg-white px-3 py-2 text-foreground outline-none transition placeholder:text-foreground/40 focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20 disabled:opacity-60 dark:bg-[var(--card)]"
                            />

                            <p className="mt-2 text-sm text-foreground/50">
                                Make sure you enter the code exactly as provided.
                            </p>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
                            >
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0"
                                />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !claimCode.trim()}
                            className="text-sm cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Verifying code...
                                </>
                            ) : (
                                <>
                                    <KeyRound size={18} />
                                    Link My Student Record
                                </>
                            )}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-foreground/50">
                    Need a code? Contact your school administrator.
                </p>
            </div>
        </div>
    );
}