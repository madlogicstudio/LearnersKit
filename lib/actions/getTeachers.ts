"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTeachers() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to view teachers.");
    }

    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching teachers:", error.message);
        throw new Error("Failed to fetch teachers.");
    }

    return data;
}
