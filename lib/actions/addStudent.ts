
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

type CreateStudentResult = {
    success: boolean;
    student_id: string;
    claim_code: string;
};

export async function createStudent(
    form: StudentForm
): Promise<CreateStudentResult> {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be logged in to add a student.");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
        throw new Error("Only School Administrators can add students.");
    }

    const { data, error } = await supabase.rpc(
        "create_student_with_claim_code",
        {
            p_student_number: form.student_number,
            p_first_name: form.first_name,
            p_last_name: form.last_name,
            p_email: form.email,
            p_gender: form.gender || null,
            p_department: form.department,
            p_year_level: form.year_level,
            p_academic_program: form.academic_program,
        }
    );

    if (error) {
        throw new Error(`Failed to create student: ${error.message}`);
    }

    // Support an RPC that returns either one object or one row in an array.
    const result = Array.isArray(data) ? data[0] : data;

    if (
        !result ||
        typeof result !== "object" ||
        !("student_id" in result) ||
        !("claim_code" in result) ||
        typeof result.student_id !== "string" ||
        typeof result.claim_code !== "string" ||
        !result.student_id ||
        !result.claim_code
    ) {
        throw new Error(
            "The student claim code was not returned. Check the return format of create_student_with_claim_code in Supabase."
        );
    }

    return {
        success: true,
        student_id: result.student_id,
        claim_code: result.claim_code,
    };
}
