"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    X,
    UserRound,
    UserPlus,
    UserMinus,
    LoaderCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Student = {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string | null;
};

type Props = {
    subjectId: string;
    subjectName: string;
    yearLevelId: string;
    onClose: () => void;
    onUpdated?: () => void;
};

export default function ManageStudentsModal({
    subjectId,
    subjectName,
    yearLevelId,
    onClose,
    onUpdated,
}: Props) {
    const supabase = useMemo(() => createClient(), []);

    const [students, setStudents] = useState<Student[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadStudents = useCallback(async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Get the currently authenticated administrator.
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please sign in again.");
            }

            // Retrieve the selected year level's name.
            const {
                data: yearLevelData,
                error: yearLevelError,
            } = await supabase
                .from("year_levels")
                .select("name")
                .eq("id", yearLevelId)
                .eq("admin_id", user.id)
                .maybeSingle();

            if (yearLevelError) {
                throw yearLevelError;
            }

            if (!yearLevelData) {
                throw new Error(
                    "The selected year level could not be found."
                );
            }

            // Students store their year level as text,
            // so compare against the year level's name.
            const {
                data: studentData,
                error: studentError,
            } = await supabase
                .from("students")
                .select(
                    "id, first_name, last_name, student_number"
                )
                .eq("admin_id", user.id)
                .eq("year_level", yearLevelData.name)
                .order("last_name");

            if (studentError) {
                throw studentError;
            }

            // Load students already enrolled in this subject.
            const {
                data: enrollmentData,
                error: enrollmentError,
            } = await supabase
                .from("student_subjects")
                .select("student_id")
                .eq("admin_id", user.id)
                .eq("subject_id", subjectId);

            if (enrollmentError) {
                throw enrollmentError;
            }

            setStudents((studentData ?? []) as Student[]);
            setEnrolledIds(
                (enrollmentData ?? []).map(
                    (row) => row.student_id as string
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load students."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase, subjectId, yearLevelId]);

    useEffect(() => {
        void loadStudents();
    }, [loadStudents]);

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return students;
        }

        return students.filter((student) =>
            [
                student.first_name,
                student.last_name,
                student.student_number ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(term)
        );
    }, [students, search]);

    async function toggleEnrollment(student: Student) {
        setBusyId(student.id);
        setError("");
        setSuccess("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please sign in again.");
            }

            const isEnrolled = enrolledIds.includes(student.id);

            if (isEnrolled) {
                const { error: deleteError } = await supabase
                    .from("student_subjects")
                    .delete()
                    .eq("admin_id", user.id)
                    .eq("subject_id", subjectId)
                    .eq("student_id", student.id);

                if (deleteError) {
                    throw deleteError;
                }

                setEnrolledIds((ids) =>
                    ids.filter((id) => id !== student.id)
                );

                setSuccess("Student removed from this subject.");
            } else {
                const { error: insertError } = await supabase
                    .from("student_subjects")
                    .insert({
                        admin_id: user.id,
                        subject_id: subjectId,
                        student_id: student.id,
                    });

                if (insertError) {
                    throw insertError;
                }

                setEnrolledIds((ids) => [...ids, student.id]);
                setSuccess("Student enrolled successfully.");
            }

            onUpdated?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update enrollment."
            );
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="manage-students-title"
                className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-foreground/10 p-5">
                    <div className="min-w-0">
                        <h2
                            id="manage-students-title"
                            className="text-lg font-semibold"
                        >
                            Manage Students
                        </h2>

                        <p className="mt-1 text-sm text-foreground/60">
                            {subjectName}
                        </p>

                        <p className="mt-2 text-xs text-foreground/60">
                            {enrolledIds.length} student
                            {enrolledIds.length === 1 ? "" : "s"} enrolled
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-lg p-2 transition hover:bg-foreground/10"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="p-5">
                    <div className="flex items-center gap-2 rounded-xl border border-foreground/15 px-3">
                        <Search
                            size={17}
                            className="shrink-0 text-foreground/50"
                        />

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search students..."
                            aria-label="Search students"
                            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                        />
                    </div>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mx-5 mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-500"
                    >
                        {error}
                    </p>
                )}

                {success && (
                    <p
                        role="status"
                        className="mx-5 mb-3 rounded-lg bg-green-500/10 p-3 text-sm text-green-600"
                    >
                        {success}
                    </p>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-foreground/60">
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Loading students...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="py-12 text-center">
                            <UserRound
                                size={28}
                                className="mx-auto mb-3 text-foreground/40"
                            />

                            <p className="text-sm font-medium">
                                {students.length === 0
                                    ? "No eligible students found"
                                    : "No students match your search"}
                            </p>

                            <p className="mt-1 text-xs text-foreground/60">
                                {students.length === 0
                                    ? "Students must belong to this year level."
                                    : "Try a different name or student number."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map((student) => {
                                const enrolled = enrolledIds.includes(
                                    student.id
                                );
                                const busy = busyId === student.id;

                                return (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 p-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--secondary)]">
                                                <UserRound size={18} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </p>

                                                <p className="mt-1 text-xs text-foreground/60">
                                                    {student.student_number ||
                                                        "No student number"}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                void toggleEnrollment(student)
                                            }
                                            className={`cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                                                enrolled
                                                    ? "border border-foreground/15 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                                                    : "bg-[var(--primary)] hover:bg-[#24232E] transition text-white hover:opacity-90"
                                            }`}
                                        >
                                            {busy ? (
                                                <LoaderCircle
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            ) : enrolled ? (
                                                <UserMinus size={14} />
                                            ) : (
                                                <UserPlus size={14} />
                                            )}

                                            {enrolled ? "Enrolled" : "Enroll"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <footer className="border-t border-foreground/10 p-4 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-foreground/15 px-4 py-2 text-sm transition hover:bg-foreground/5"
                    >
                        Done
                    </button>
                </footer>
            </section>
        </div>
    );
}
