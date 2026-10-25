
"use server";

import { createClient } from "@/lib/supabase/server";

export async function redeemStudentClaimCode(claimCode: string) {
    const normalizedCode = claimCode.trim().toUpperCase();

    if (!normalizedCode) {
        throw new Error("Please enter your claim code.");
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Please sign in to claim your student record.");
    }

    const { data, error } = await supabase.rpc(
        "redeem_student_claim_code",
        {
            p_claim_code: normalizedCode,
        }
    );

    if (error) {
        console.error("Claim code redemption failed:", error.message);

        if (error.message.includes("does not match")) {
            throw new Error(
                "Your account email does not match this student record. Contact your administrator."
            );
        }

        if (error.message.includes("already linked")) {
            throw new Error(
                "This student record is already linked to an account."
            );
        }

        if (
            error.message.includes("Invalid, expired") ||
            error.message.includes("already been used")
        ) {
            throw new Error(
                "This claim code is invalid, expired, or has already been used."
            );
        }

        throw new Error(
            "Unable to verify your claim code. Please try again or contact your administrator."
        );
    }

    const result = data as {
        success?: boolean;
        student_id?: string;
    };

    if (!result?.success || !result.student_id) {
        throw new Error("The claim code could not be redeemed.");
    }

    return result;
}
