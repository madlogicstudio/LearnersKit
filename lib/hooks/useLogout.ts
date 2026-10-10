"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/user";

export function useLogout() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function logout() {
        setLoading(true);
        setError(null);

        try {
        const success = await signOut();

        if (!success) {
            setError("Failed to log out. Please try again.");
            return false;
        }

        router.replace("/login");
        router.refresh();

        return true;
        } catch {
        setError("Something went wrong. Please try again.");
        return false;
        } finally {
        setLoading(false);
        }
    }

    return { logout, loading, error };
}
