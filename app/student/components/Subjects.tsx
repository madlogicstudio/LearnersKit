
"use client";

import { useEffect, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    BookOpen,
    Search,
    RefreshCw,
    BookMarked,
    GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
    admin_id: string | null;
    role: string;
};

type StudentRecord = {
    id: string;
};

type StudentSubjectEnrollment = {
    subject_id: string;
};

type StudentSubject = {
    id: string;
    name: string;
    code: string | null;
};

export default function Subjects() {
    const [subjects, setSubjects] = useState<StudentSubject[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchSubjects() {
            setLoading(true);
            setError("");

            try {
                // 1. Get the authenticated student.
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    window.location.replace("/login");
                    return;
                }

                // 2. Load the student's profile.
                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("admin_id, role")
                        .eq("id", user.id)
                        .single();

                if (profileError) throw profileError;

                const profile = profileData as StudentProfile;

                if (profile.role !== "student") {
                    window.location.replace("/login");
                    return;
                }

                if (!profile.admin_id) {
                    throw new Error(
                        "Your account is not linked to a school administrator yet. Please complete the claim-code step."
                    );
                }

                // 3. Find the student's linked student record.
                const { data: studentData, error: studentError } =
                    await supabase
                        .from("students")
                        .select("id")
                        .eq("user_id", user.id)
                        .eq("admin_id", profile.admin_id)
                        .maybeSingle();

                if (studentError) throw studentError;

                if (!studentData) {
                    throw new Error(
                        "Your student record could not be found. Please contact your school administrator."
                    );
                }

                const student = studentData as StudentRecord;

                // 4. Fetch this student's enrolled subject IDs.
                const {
                    data: enrollmentData,
                    error: enrollmentError,
                } = await supabase
                    .from("student_subjects")
                    .select("subject_id")
                    .eq("admin_id", profile.admin_id)
                    .eq("student_id", student.id);

                if (enrollmentError) throw enrollmentError;

                const enrollments =
                    (enrollmentData ?? []) as StudentSubjectEnrollment[];

                const subjectIds = [
                    ...new Set(
                        enrollments.map(
                            (enrollment) => enrollment.subject_id
                        )
                    ),
                ];

                // 5. Fetch only the subjects assigned to this student.
                let loadedSubjects: StudentSubject[] = [];

                if (subjectIds.length > 0) {
                    const {
                        data: subjectData,
                        error: subjectError,
                    } = await supabase
                        .from("subjects")
                        .select("id, name, code")
                        .eq("admin_id", profile.admin_id)
                        .in("id", subjectIds)
                        .order("name", { ascending: true });

                    if (subjectError) throw subjectError;

                    loadedSubjects =
                        (subjectData ?? []) as StudentSubject[];
                }

                if (!cancelled) {
                    setSubjects(loadedSubjects);
                }
            } catch (err) {
                console.error("Student subjects error:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load your subjects."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchSubjects();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredSubjects = subjects.filter((subject) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
            subject.name.toLowerCase().includes(query) ||
            (subject.code ?? "").toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 hide-scrollbar sm:gap-6 sm:p-6">
            {/* Page header */}
            <header className="flex flex-col gap-2 px-1 sm:px-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <BookOpen size={23} />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            My Subjects
                        </h1>

                        <p className="mt-1 text-sm leading-6 text-foreground/55 sm:text-base">
                            View the subjects assigned to your student record.
                        </p>
                    </div>
                </div>
            </header>

            {/* Subject summary */}
            <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                        <GraduationCap size={25} />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm text-foreground/55">
                            Total enrolled subjects
                        </p>

                        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                            {loading ? "..." : subjects.length}
                        </p>
                    </div>
                </div>
            </section>

            {/* Search and subject list */}
            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Enrolled Subjects
                        </h2>

                        <p className="mt-1 text-sm text-foreground/55">
                            Your currently assigned academic subjects.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search subjects..."
                            aria-label="Search subjects"
                            className="w-full rounded-xl border border-foreground/15 bg-white py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 dark:bg-[var(--card)]"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-white p-8 dark:bg-[var(--card)]">
                        <RefreshCw
                            size={25}
                            className="animate-spin text-[var(--primary)]"
                        />
                        <p className="text-sm text-foreground/55">
                            Loading your subjects...
                        </p>
                    </div>
                ) : error ? (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-500/20 bg-white p-6 text-sm text-red-600 dark:bg-[var(--card)] dark:text-red-400"
                    >
                        <p className="font-semibold">
                            Unable to load your subjects
                        </p>
                        <p className="mt-2 leading-6">{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5"
                        >
                            Try again
                        </button>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-12 text-center shadow-sm dark:bg-[var(--card)]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
                            <BookMarked size={27} />
                        </div>

                        <h3 className="mt-4 font-semibold text-foreground">
                            No subjects assigned yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/55">
                            Your subjects will appear here once your school
                            administrator enrolls you in them.
                        </p>
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-10 text-center dark:bg-[var(--card)]">
                        <Search
                            size={25}
                            className="mx-auto text-foreground/35"
                        />

                        <p className="mt-3 font-medium text-foreground">
                            No matching subjects
                        </p>

                        <p className="mt-1 text-sm text-foreground/55">
                            Try another subject name or subject code.
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredSubjects.map((subject) => (
                            <article
                                key={subject.id}
                                className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[var(--card)]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                        <BookOpen size={22} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="break-words font-semibold text-foreground">
                                            {subject.name}
                                        </h3>

                                        <p className="mt-1 break-words text-sm text-foreground/55">
                                            {subject.code || "No subject code"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                                    <span className="text-xs text-foreground/50">
                                        Enrollment status
                                    </span>

                                    <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-medium text-foreground">
                                        Enrolled
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <p className="px-1 text-xs text-foreground/45 sm:px-2">
                        Showing {filteredSubjects.length} of {subjects.length}{" "}
                        subjects
                    </p>
                )}
            </section>
        </div>
    );
}
