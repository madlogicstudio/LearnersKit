"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { FcGoogle } from "react-icons/fc";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function page() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const role = "admin";

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if(!captchaToken) {
            setError("Captcha failed. Try again later.")
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                captchaToken,
                data: {
                    role: "educator",
                },
            },
        });

        if (error) {
            if (error.message.toLowerCase().includes("rate limit")) {
                setError(
                    "Too many signup emails have been requested. Please try again later."
                );
            } else {
                setError(error.message);
            }

            setLoading(false);
            return;
        }

        setSuccess(
            "Account created! Please check your email and click the confirmation link to continue."
        );

        setLoading(false);

    };

    const handleGoogleSignup = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session && event === "SIGNED_IN") {
                    const { data: profile, error } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    if (error || !profile) {
                        console.error("Failed to fetch user role:", error);
                        return;
                    }

                    switch (profile.role) {
                        case "admin":
                            window.location.replace("/admin/dashboard");
                            break;

                        case "educator":
                            window.location.replace("/educator/dashboard");
                            break;

                        case "student":
                            window.location.replace("/student/dashboard");
                            break;

                        default:
                            window.location.replace("/login");
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    return (
        <section className="fadeIn h-screen w-full flex flex-col items-center justify-center sm:p-24 p-0 bg-[var(--background)] gap-3">
            
            <div className="font-sans h-full lg:max-w-[1280px] w-full rounded-xl bg-white/10 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5
                flex flex-row-reverse items-center">

                <div className="flex-1 h-full sm:flex hidden flex-col items-center justify-center gap-3 bg-[var(--accent)] dark:bg-[var(--secondary)] rounded-xl rounded-l-none">

                    <Image src="/images/Signup-image-educator.svg" height={480} width={480} alt="Login Illustration" className="" loading="eager" />

                    <span className="text-3xl text-foreground">Create your educator account</span>
                    <span className="max-w-[480px] text-lg text-foreground text-center">Create your educator account to manage classes, organize student records, and access academic information.</span>

                </div>

                <div className="flex-1 h-full bg-white dark:bg-[var(--background)]/10 flex flex-col items-center justify-center rounded-xl rounded-r-none">

                    <form onSubmit={handleSignup} className="font-sans space-y-5 sm:min-w-[420px] w-full sm:px-24 p-3 flex flex-col items-center">

                        <div className="flex flex-row items-center gap-3">
                            <Image src="/Web-icon.png" height={32} width={32} alt="LearnersKit Icon" className="h-auto w-auto" />
                            <span className="font-semibold text-2xl sm:w-full text-[var(--primary)]">Signup as an Educator</span>
                        </div>
                        <span className="block sm:hidden text-md">Create your educator account</span>

                        <button type="button" onClick={handleGoogleSignup} disabled={loading} className="w-full mt-6 flex flex-row items-center justify-center gap-3 p-3 rounded-lg bg-[#EFEFF4] hover:bg-[var(--accent)] dark:hover:bg-[var(--primary)] transition cursor-pointer">
                            <FcGoogle size={24} />
                            <span className="text-sm text-[#2E2C39]">{loading ? "Connecting to Google..." : "Continue with Google"}</span>
                        </button>

                        {error && (
                            <div className="mb-5 rounded-lg border border-red-300/50 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-5 rounded-lg border border-[var(--primary)]/50 px-4 py-3 text-sm text-[var(--primary)]">
                                {success}
                            </div>
                        )}

                        <div className="font-sans w-full">

                            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground/60">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 text-sm text-[#1A233A] outline-none transition placeholder:text-gray-400 focus:border-[#5578C9] focus:ring-4 focus:ring-[#5578C9]/10"
                            />

                        </div>


                        <div className="w-full">

                            <div className="font-sans mb-2 flex items-end justify-between">

                                <label htmlFor="password"
                                    className="block text-sm font-semibold text-foreground/60">
                                    Password
                                </label>

                                <Link href="/forgot-password"
                                    className="text-sm font-semibold text-[var(--primary)]/80 transition hover:text-[var(--secondary)]">
                                    Forgot password?
                                </Link>

                            </div>

                            <div className="relative font-sans">

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 pr-12 text-sm text-[#1A233A] outline-none transition placeholder:text-gray-400 focus:border-[#5578C9] focus:ring-4 focus:ring-[#5578C9]/10"
                                />

                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#5578C9]">
                                    {showPassword ? (
                                        <EyeOff size={18} className="cursor-pointer"/>
                                    ) : (
                                        <Eye size={18} className="cursor-pointer"/>
                                    )}
                                </button>

                            </div>

                        </div>

                        <div className="w-full">

                            <div className="font-sans mb-2 flex items-end justify-between">

                                <label htmlFor="confirmPassword"
                                    className="block text-sm font-semibold text-foreground/60">
                                    Confirm Password
                                </label>

                            </div>

                            <div className="relative font-sans">

                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 pr-12 text-sm text-[#1A233A] outline-none transition placeholder:text-gray-400 focus:border-[#5578C9] focus:ring-4 focus:ring-[#5578C9]/10"
                                />

                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#5578C9]">
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} className="cursor-pointer"/>
                                    ) : (
                                        <Eye size={18} className="cursor-pointer"/>
                                    )}
                                </button>

                            </div>

                        </div>

                        <Turnstile
                            key="admin-signup-turnstile"
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                            onSuccess={(token) => {
                                setCaptchaToken(token);
                                setError("");
                            }}
                            onExpire={() => {
                                setCaptchaToken(null);
                            }}
                            onError={() => {
                                setCaptchaToken(null);
                                setError("Captcha failed. Please refresh and try again.");
                            }}
                        />

                        <button type="submit" disabled={loading}
                            className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--primary)] transition duration-300 ease-in-out
                            text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[var(--secondary)]">
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Signing up...
                                </>
                            ) : (
                                <>
                                    Sign up
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                    </form>

                    <p className="font-sans mt-3 text-center sm:text-md text-sm text-foreground/80">
                        Already have an account?{" "}
                        <Link href="/login" className="ml-1 font-bold text-[var(--primary)]/80 transition hover:text-[var(--secondary)]">
                            Login
                        </Link>
                    </p>

                </div>

            </div>

        </section>  
    )
}

export default page