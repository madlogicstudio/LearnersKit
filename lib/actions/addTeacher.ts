"use server";

import { createClient } from "@/lib/supabase/server";

type TeacherFormData = {
    teacher_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    department: string;
    academic_program: string;
    employment_status: string;
};

export async function createTeacher(form: TeacherFormData) {
    const supabase = await createClient();

    // Get the currently authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to add a teacher.");
    }

    // Insert the teacher record
    const { error } = await supabase
        .from("teachers")
        .insert({
            admin_id: user.id,
            teacher_number: form.teacher_number.trim(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim().toLowerCase(),
            gender: form.gender || null,
            department: form.department.trim() || null,
            academic_program: form.academic_program.trim() || null,
            employment_status: form.employment_status || "Active",
        });

    if (error) {
        console.error("Error adding teacher:", error.message);

        if (error.code === "23505") {
            throw new Error(
                "This teacher number or email already exists."
            );
        }

        throw new Error("Failed to add teacher. Please try again.");
    }

    return { success: true };
}
