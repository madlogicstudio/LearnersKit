"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Check, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminInviteCode() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadInviteCode = async () => {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setError("Unable to identify admin.");
                setLoading(false);
                return;
            }

            const { data, error: queryError } = await supabase
                .from("admin_invite_codes")
                .select("code")
                .eq("admin_id", user.id)
                .eq("is_active", true)
                .maybeSingle();

            console.log("Authenticated user ID:", user.id);
            console.log("Invite code query result:", { data, queryError });

            if (queryError) {
                console.error("Failed to load invite code:", queryError);
                setError(queryError.message);
            } else if (data) {
                setCode(data.code);
            } else {
                setError("No active invite code found for this account.");
            }

            setLoading(false);
        };

        loadInviteCode();
    }, []);

    const copyCode = async () => {
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Unable to copy code.");
        }
    };

    return (
        <div className="w-full rounded-xl border border-[var(--primary)]/20 bg-[var(--accent)]/50 p-3 dark:bg-foreground/5">
            <div className="mb-3 flex items-center justify-between gap-2">
 
                <span className="text-sm text-foreground/80">
                     Invite Code
                </span>
                <button
                        type="button"
                        onClick={copyCode}
                        title="Copy invite code"
                        aria-label="Copy invite code"
                        className="cursor-pointer rounded-md p-2 text-[var(--primary)] transition hover:bg-foreground/10"
                    >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading code...
                </div>
            ) : code ? (
                <div className="flex sm:flex-col flex-row items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-md bg-white px-2 py-2 text-sm font-bold tracking-wider text-[#2E2C39] dark:bg-black/20 dark:text-foreground">
                        {code}
                    </code>

                    
                </div>
            ) : (
                <p className="text-xs text-foreground/60">{error}</p>
            )}

            {copied && (
                <p className="mt-2 text-xs text-green-600">
                    Invite code copied!
                </p>
            )}
        </div>
    );
}
