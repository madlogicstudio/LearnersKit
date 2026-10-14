"use server";

import { createClient } from "@/lib/supabase/server";

type StudentForm = {
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    department: string;
    year_level: string;
    academic_program: string;
};

export async function createStudent(form: StudentForm) {
    const supabase = await createClient();

    // Get the currently authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to add a student.");
    }

    // Confirm that the user is a School Administrator
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
        throw new Error("Only School Administrators can add students.");
    }

    // Insert the student and associate the record with this admin
    const { error } = await supabase.from("students").insert({
        ...form,
        admin_id: user.id,
    });

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}