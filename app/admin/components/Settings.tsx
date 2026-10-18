"use client";

import { useEffect, useState } from "react";
import {
    UserRound,
    ShieldCheck,
    Palette,
    Bell,
    Info,
    Save,
    Eye,
    EyeOff,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
    LockKeyhole,
    Mail,
    Monitor,
    Moon,
    Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import Image from "next/image";
import { getCurrentUser } from "@/lib/supabase/user";

type Profile = {
    full_name: string;
    email: string;
};

type NoticeSettings = {
    studentRegistration: boolean;
    enrollmentUpdates: boolean;
    systemAnnouncements: boolean;
};

const initialNotifications: NoticeSettings = {
    studentRegistration: true,
    enrollmentUpdates: true,
    systemAnnouncements: true,
};

const inputClass =
    "mt-3 w-full rounded-xl border border-foreground/15 bg-transparent px-3.5 py-2.5 text-sm outline-none transition placeholder:text-foreground/40 focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--primary)]/15";

const buttonClass =
    "cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export default function Settings() {
    const supabase = createClient();
    const { theme, setTheme } = useTheme();

    const [profile, setProfile] = useState<Profile>({
        full_name: "",
        email: "",
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [notifications, setNotifications] =
        useState<NoticeSettings>(initialNotifications);

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mounted, setMounted] = useState(false);

    const [profileImage, setProfileImage] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadProfile() {
            
            const user = await getCurrentUser();
            setProfileImage(user?.profileImage ?? null);
            setLoading(false);

            setLoading(true);
            setError("");

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    throw new Error("Please log in to access settings.");
                }

                const { data, error: profileError } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (active) {
                    setProfile({
                        full_name: data?.full_name ?? "",
                        email: user.email ?? "",
                    });
                }
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load settings."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadProfile();

        return () => {
            active = false;
        };
    }, [supabase]);

    function showSuccess(message: string) {
        setError("");
        setSuccess(message);
    }

    async function handleSaveProfile(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const fullName = profile.full_name.trim();

        if (!fullName) {
            setError("Please enter your full name.");
            return;
        }

        setSavingProfile(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Your session has expired. Please log in again.");
            }

            // Update the profile record belonging to the signed-in user.
            const { data, error: updateError } = await supabase
                .from("profiles")
                .update({ full_name: fullName })
                .eq("id", user.id)
                .select("id");

            if (updateError) throw updateError;

            if (!data?.length) {
                throw new Error(
                    "Profile was not updated. Check your database permissions."
                );
            }

            showSuccess("Profile updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update your profile."
            );
        } finally {
            setSavingProfile(false);
        }
    }

    async function handleChangePassword(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please complete all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Your new password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The new passwords do not match.");
            return;
        }

        setSavingPassword(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user?.email) {
                throw new Error("Please log in again.");
            }

            // Verify the current password before changing it.
            const { error: verifyError } =
                await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                });

            if (verifyError) {
                throw new Error("Your current password is incorrect.");
            }

            const { error: updateError } =
                await supabase.auth.updateUser({
                    password: newPassword,
                });

            if (updateError) throw updateError;

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showSuccess("Password changed successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to change your password."
            );
        } finally {
            setSavingPassword(false);
        }
    }

    function toggleNotification(key: keyof NoticeSettings) {
        setNotifications((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="font-sans min-h-full overflow-y-auto hide-scrollbar space-y-6 p-5 font-sans text-foreground sm:p-6">
            {/* Page heading */}
            <div>
                <h1 className="text-xl font-semibold">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-foreground/60">
                    Manage your account and application preferences.
                </p>
            </div>

            {/* Feedback */}
            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-600"
                >
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 bg-white dark:bg-[var(--card)] p-6">
                <div className="flex flex-col gap-4 border-b border-foreground/10 pb-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/20 text-[var(--secondary)]">
                        {profileImage ? 
                            <Image src={profileImage} height={36} width={36} alt="" className="h-full w-full rounded-full"/>
                            :
                            <UserRound size={30} />
                        }
                    </div>

                    <div className="min-w-0">
                        <p className="font-medium">
                            {profile.full_name || "Administrator"}
                        </p>
                        <p className="mt-1 break-all text-sm text-foreground/60">
                            {profile.email}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-medium text-[var(--secondary)]">
                            Administrator
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="full-name"
                            className="text-sm font-medium"
                        >
                            Full Name
                        </label>
                        <input
                            id="full-name"
                            value={profile.full_name}
                            onChange={(event) =>
                                setProfile((previous) => ({
                                    ...previous,
                                    full_name: event.target.value,
                                }))
                            }
                            placeholder="Enter your full name"
                            maxLength={100}
                            required
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                            />
                            <input
                                id="email"
                                type="email"
                                value={profile.email}
                                readOnly
                                className={`${inputClass} cursor-not-allowed pl-9 opacity-70`}
                            />
                        </div>
                        <p className="text-xs text-foreground/50">
                            Your email is managed by your authentication
                            account.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={savingProfile}
                        className={buttonClass}
                    >
                        {savingProfile ? (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Profile
                    </button>
                </div>
            </form>

            {/* Security */}
            <SettingsSection
                icon={<ShieldCheck size={20} />}
                title="Security"
                description="Update your password to keep your account secure."
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="current-password"
                            className="text-sm font-medium"
                        >
                            Current Password
                        </label>
                        <PasswordInput
                            id="current-password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            visible={showPassword}
                            placeholder="Enter your current password"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="new-password"
                                className="text-sm font-medium"
                            >
                                New Password
                            </label>
                            <PasswordInput
                                id="new-password"
                                value={newPassword}
                                onChange={setNewPassword}
                                visible={showPassword}
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="confirm-password"
                                className="text-sm font-medium"
                            >
                                Confirm New Password
                            </label>
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                visible={showPassword}
                                placeholder="Re-enter your new password"
                            />
                        </div>
                    </div>

                    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground/60">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(event) =>
                                setShowPassword(event.target.checked)
                            }
                            className="accent-[var(--secondary)]"
                        />
                        Show passwords
                    </label>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className={buttonClass}
                        >
                            {savingPassword ? (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <LockKeyhole size={16} />
                            )}
                            Change Password
                        </button>
                    </div>
                </form>
            </SettingsSection>

            {/* Appearance */}
            <SettingsSection
                icon={<Palette size={20} />}
                title="Appearance"
                description="Choose how LearnersKit looks on your device."
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium">Interface Theme</p>
                        <p className="mt-1 text-sm text-foreground/60">
                            Select your preferred display mode.
                        </p>
                    </div>

                    {mounted && (
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                {
                                    value: "system",
                                    label: "System",
                                    icon: <Monitor size={16} />,
                                },
                                {
                                    value: "dark",
                                    label: "Dark",
                                    icon: <Moon size={16} />,
                                },
                                {
                                    value: "light",
                                    label: "Light",
                                    icon: <Sun size={16} />,
                                },
                            ].map((option) => {
                                const active = theme === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setTheme(option.value)}
                                        className={`font-sans flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition ${
                                            active
                                                ? "border-[var(--secondary)] bg-[var(--primary)]/15 text-[var(--secondary)]"
                                                : "border-foreground/15 hover:bg-foreground/5"
                                        }`}
                                    >
                                        {option.icon}
                                        <span className="text-xs">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection
                icon={<Bell size={20} />}
                title="Notifications"
                description="Choose which notifications you want to enable."
            >
                <div className="divide-y divide-foreground/10">
                    <NotificationRow
                        title="Student Registrations"
                        description="Alerts when a student registers."
                        checked={notifications.studentRegistration}
                        onChange={() =>
                            toggleNotification("studentRegistration")
                        }
                    />

                    <NotificationRow
                        title="Enrollment Updates"
                        description="Alerts about enrollment-related changes."
                        checked={notifications.enrollmentUpdates}
                        onChange={() => toggleNotification("enrollmentUpdates")}
                    />

                    <NotificationRow
                        title="System Announcements"
                        description="Important information about the system."
                        checked={notifications.systemAnnouncements}
                        onChange={() =>
                            toggleNotification("systemAnnouncements")
                        }
                    />
                </div>

                <p className="mt-4 text-xs text-foreground/50">
                    These notification preferences are currently temporary and
                    reset when the page is reloaded. Connect them to your
                    database to save them permanently.
                </p>
            </SettingsSection>

            {/* About */}
            <SettingsSection
                icon={<Info size={20} />}
                title="About LearnersKit"
                description="A student information and records management system"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="p-1">
                        <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">LearnersKit</p>
                        <p className="mt-1 text-sm text-foreground/60">
                            Every Student. Every Record. One System.
                        </p>
                    </div>
                    <span className="w-fit rounded-full border border-foreground/10 px-3 py-1.5 text-xs text-foreground/60">
                        Version 1.0.0
                    </span>
                </div>
            </SettingsSection>
        </div>
    );
}

function SettingsSection({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 dark:bg-[var(--card)] sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--secondary)]">
                    {icon}
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </section>
    );
}

function PasswordInput({
    id,
    value,
    onChange,
    visible,
    placeholder,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    placeholder: string;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete="current-password"
                required
                className={`${inputClass} pr-11`}
            />

            <button
                type="button"
                onClick={() => {
                    // The parent controls visibility for all password fields.
                    const checkbox = document.getElementById(
                        "show-passwords"
                    ) as HTMLInputElement | null;

                    if (checkbox) checkbox.click();
                }}
                aria-label={visible ? "Password visibility enabled" : "Password visibility"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                hidden
            >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
        </div>
    );
}

function NotificationRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm text-foreground/60">
                    {description}
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                onClick={onChange}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked ? "bg-[var(--secondary)]" : "bg-foreground/20"
                }`}
            >
                <span
                    className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-6" : "translate-x-0.5"
                    }`}
                />
            </button>
        </div>
    );
}

function BookOpenIcon() {
    return <UserRound size={23} />;
}
