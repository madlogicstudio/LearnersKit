"use client";

import { LogOut } from "lucide-react";
import { useLogout } from "@/lib/hooks/useLogout";

export default function LogoutButton() {
    const { logout, loading, error } = useLogout();

    return (
        <div>
            <button
                onClick={logout}
                disabled={loading}
                className="font-sans bg-[var(--primary)]/60 transition duration-300 ease cursor-pointer max-w-[160px]
                flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
            >
                <LogOut size={16} />
                {loading ? "Logging out..." : "Log out"}
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}