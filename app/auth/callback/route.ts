import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next");

    if (!code) {
        return NextResponse.redirect(
        `${origin}/login?error=missing_code`
        );
    }

    const supabase = await createClient();

    const { error } =
        await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(
        `${origin}/login?error=verification_failed`
        );
    }

    // Email verification can return to the signup page.
    if (next === "verify-email") {
        return NextResponse.redirect(
        `${origin}/signup/student?verified=true`
        );
    }

    // Get the authenticated user's role from the database.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(
        `${origin}/login?error=authentication_failed`
        );
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
        return NextResponse.redirect(
        `${origin}/login?error=profile_missing`
        );
    }

    // TODO: Replace these with your onboarding routes
    // when your onboarding pages are ready.
    if (!profile.onboarding_completed) {
        switch (profile.role) {
        case "admin":
            return NextResponse.redirect(
            `${origin}/admin/dashboard`
            );
        case "educator":
            return NextResponse.redirect(
            `${origin}/educator/dashboard`
            );
        default:
            return NextResponse.redirect(
            `${origin}/student/dashboard`
            );
        }
    }

    switch (profile.role) {
        case "admin":
        return NextResponse.redirect(
            `${origin}/admin/dashboard`
        );
        case "educator":
        return NextResponse.redirect(
            `${origin}/educator/dashboard`
        );
        default:
        return NextResponse.redirect(
            `${origin}/student/dashboard`
        );
    }
}