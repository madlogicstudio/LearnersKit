
"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteStudent(studentId: string) {
    if (!studentId?.trim()) {
        throw new Error("Student ID is required.");
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to delete a student.");
    }

    const { data, error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId)
        .eq("admin_id", user.id)
        .select("id");

    if (error) {
        throw new Error(`Failed to delete student: ${error.message}`);
    }

    if (!data || data.length === 0) {
        throw new Error(
            "No student was deleted. Check your Supabase RLS delete policy and student ID."
        );
    }

    return { success: true };
}
