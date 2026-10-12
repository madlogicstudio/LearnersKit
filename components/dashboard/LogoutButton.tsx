"use client";

import { LogOut } from "lucide-react";
import { useLogout } from "@/lib/hooks/useLogout";
import { Ellipsis } from "lucide-react";

export default function LogoutButton() {
    const { logout, loading, error } = useLogout();

    return (
        <div>
            <button
                onClick={logout}
                disabled={loading}
                title="Logout"
                className="font-sans bg-[var(--primary)] dark:bg-foreground/20 transition duration-300 ease cursor-pointer text-white
                flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
            >
                {loading ?
                    <>
                        <Ellipsis size={14} /> 
                        <span className="text-sm">Logging out</span>
                    </> 
                    : 
                    <>
                        <LogOut size={14} /> 
                        <span className="text-sm">Log out</span>
                    </>
                    
                }
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}