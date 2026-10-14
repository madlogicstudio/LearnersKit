import { createClient } from "@/lib/supabase/client";

export async function getStudents() {
    const supabase = createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to view students.");
    }

    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
