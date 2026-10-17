"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteTeacher(teacherId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to delete teachers.");
    }

    const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", teacherId)
        .eq("admin_id", user.id);

    if (error) {
        console.error("Error deleting teacher:", error.message);
        throw new Error("Failed to delete teacher.");
    }

    return { success: true };
}
