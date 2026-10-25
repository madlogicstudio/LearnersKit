
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
    X,
    LoaderCircle,
    Copy,
    Check,
    KeyRound,
    UserRoundCheck,
    AlertCircle,
} from "lucide-react";
import SelectInput from "../ui/SelectInput";
import { createStudent } from "@/lib/actions/addStudent";
import { createClient } from "@/lib/supabase/client";

type Department = {
    id: string;
    name: string;
};

type Course = {
    id: string;
    name: string;
    department_id: string;
};

type CreatedStudent = {
    student_id: string;
    claim_code: string;
};

type AddStudentFormProps = {
    setAddStudent: React.Dispatch<React.SetStateAction<boolean>>;
    onStudentAdded: () => Promise<void>;
    onClaimCodeGenerated: (studentId: string, code: string) => void;
};

const initialForm = {
    student_number: "",
    first_name: "",
    last_name: "",
    email: "",
    gender: "",
    department: "",
    year_level: "",
    academic_program: "",
};

const inputClassName =
    "w-full rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/45 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 dark:bg-[var(--card)]";

export default function AddStudentForm({
    setAddStudent,
    onStudentAdded,
    onClaimCodeGenerated,
}: AddStudentFormProps) {
    const supabase = useMemo(() => createClient(), []);

    const [form, setForm] = useState(initialForm);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [createdStudent, setCreatedStudent] =
        useState<CreatedStudent | null>(null);
    const [copied, setCopied] = useState(false);

    const loadOptions = useCallback(async () => {
        setLoadingOptions(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please sign in again.");
            }

            const [
                { data: departmentData, error: departmentError },
                { data: courseData, error: courseError },
            ] = await Promise.all([
                supabase
                    .from("departments")
                    .select("id, name")
                    .eq("admin_id", user.id)
                    .order("name"),

                supabase
                    .from("courses")
                    .select("id, name, department_id")
                    .eq("admin_id", user.id)
                    .order("name"),
            ]);

            if (departmentError) throw departmentError;
            if (courseError) throw courseError;

            setDepartments((departmentData ?? []) as Department[]);
            setCourses((courseData ?? []) as Course[]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load departments and courses."
            );
        } finally {
            setLoadingOptions(false);
        }
    }, [supabase]);

    useEffect(() => {
        void loadOptions();
    }, [loadOptions]);

    const availableCourses = useMemo(() => {
        const selectedDepartment = departments.find(
            (department) => department.name === form.department
        );

        if (!selectedDepartment) return [];

        return courses.filter(
            (course) => course.department_id === selectedDepartment.id
        );
    }, [departments, courses, form.department]);

    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleDepartmentChange(value: string) {
        setForm((previous) => ({
            ...previous,
            department: value,
            academic_program: "",
        }));
    }

    function handleCourseChange(value: string) {
        setForm((previous) => ({
            ...previous,
            academic_program: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (loading || loadingOptions) return;

        setError("");

        const validDepartment = departments.some(
            (department) => department.name === form.department
        );

        if (!validDepartment) {
            setError("Please select a valid department.");
            return;
        }

        const validCourse = availableCourses.some(
            (course) => course.name === form.academic_program
        );

        if (!validCourse) {
            setError("Please select a valid academic program.");
            return;
        }

        setLoading(true);

        try {
            const result = await createStudent(form);

            if (
                !result ||
                typeof result.student_id !== "string" ||
                typeof result.claim_code !== "string" ||
                !result.student_id ||
                !result.claim_code
            ) {
                throw new Error(
                    "No claim code was returned. Check the create_student_with_claim_code RPC in Supabase."
                );
            }

            const created: CreatedStudent = {
                student_id: result.student_id,
                claim_code: result.claim_code,
            };

            // Keep the code in this modal so the admin can copy it.
            setCreatedStudent(created);

            // Pass the code to the parent Students tab.
            onClaimCodeGenerated(
                created.student_id,
                created.claim_code
            );

            setForm(initialForm);
            setCopied(false);

            // Student creation has already succeeded. A refresh failure
            // must not hide or discard the generated claim code.
            try {
                await onStudentAdded();
            } catch (refreshError) {
                console.error(
                    "Student created, but the list refresh failed:",
                    refreshError
                );

                setError(
                    "Student created successfully, but the student list could not refresh. Your claim code is still available below."
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add student."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleCopyCode() {
        if (!createdStudent?.claim_code) return;

        try {
            await navigator.clipboard.writeText(
                createdStudent.claim_code
            );

            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setError(
                "Unable to copy automatically. Please select the code and copy it manually."
            );
        }
    }

    function handleClose() {
        if (loading) return;
        setAddStudent(false);
    }

    function handleAddAnother() {
        setCreatedStudent(null);
        setError("");
        setCopied(false);
        setForm(initialForm);
    }

    return (
        <div className="fadeIn mx-3 space-y-3 rounded-xl bg-white p-4 text-sm text-foreground shadow-sm dark:border dark:border-foreground/10 dark:bg-[var(--card)] sm:mx-0 sm:p-6">
            <div className="flex w-full items-center justify-between gap-3 py-2 sm:py-3">
                <div>
                    <h2 className="text-lg font-semibold">
                        {createdStudent ? "Student Created" : "Add Student"}
                    </h2>

                    <p className="mt-1 text-xs text-foreground/60">
                        {createdStudent
                            ? "Copy and securely provide the claim code to the student."
                            : "Enter the student's academic information."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    aria-label="Close form"
                    className="rounded-xl border border-foreground/20 bg-white p-2.5 text-foreground transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)]"
                >
                    <X size={18} />
                </button>
            </div>

            {createdStudent ? (
                <div className="space-y-5 py-2">
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <UserRoundCheck size={21} />
                        </div>

                        <div>
                            <p className="font-semibold">
                                Student added successfully
                            </p>

                            <p className="mt-1 text-sm leading-5 text-foreground/65">
                                Provide this claim code to the student so
                                they can link their account to this record.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="student-claim-code"
                            className="block font-medium"
                        >
                            Student claim code
                        </label>

                        <div className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.03] p-2 dark:bg-white/[0.03]">
                            <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                                <KeyRound
                                    size={18}
                                    className="shrink-0 text-[var(--secondary)]"
                                />

                                <code
                                    id="student-claim-code"
                                    className="break-all text-base font-bold tracking-widest sm:text-lg"
                                >
                                    {createdStudent.claim_code}
                                </code>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2.5 font-medium text-white transition hover:opacity-85"
                            >
                                {copied ? (
                                    <Check size={16} />
                                ) : (
                                    <Copy size={16} />
                                )}

                                <span>
                                    {copied ? "Copied" : "Copy"}
                                </span>
                            </button>
                        </div>

                        <p className="text-xs leading-5 text-foreground/55">
                            Give this code to the intended student through
                            a secure channel. Do not use the student's
                            database ID as a claim code.
                        </p>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="flex items-start gap-2 rounded-xl bg-red-500/5 p-3 text-sm text-red-500"
                        >
                            <AlertCircle
                                size={16}
                                className="mt-0.5 shrink-0"
                            />
                            <span>{error}</span>
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-2 border-t border-foreground/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-xl border border-foreground/20 bg-white px-4 py-2.5 font-medium transition hover:bg-foreground/5 dark:bg-[var(--card)]"
                        >
                            Close
                        </button>

                        <button
                            type="button"
                            onClick={handleAddAnother}
                            className="rounded-xl bg-[var(--primary)] px-4 py-2.5 font-medium text-white transition hover:opacity-85"
                        >
                            Add Another Student
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {loadingOptions ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-foreground/60">
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Loading departments and courses...
                        </div>
                    ) : (
                        <>
                            {departments.length === 0 && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-foreground/70">
                                    No departments were found for your
                                    account. Create a department before
                                    adding a student.
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="student_number"
                                        className="block font-medium text-foreground/80"
                                    >
                                        Student Number
                                    </label>

                                    <input
                                        id="student_number"
                                        name="student_number"
                                        value={form.student_number}
                                        onChange={handleTextChange}
                                        placeholder="Enter student number"
                                        autoComplete="off"
                                        required
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="email"
                                        className="block font-medium text-foreground/80"
                                    >
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleTextChange}
                                        placeholder="student@example.com"
                                        autoComplete="email"
                                        required
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="first_name"
                                        className="block font-medium text-foreground/80"
                                    >
                                        First Name
                                    </label>

                                    <input
                                        id="first_name"
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleTextChange}
                                        placeholder="Enter first name"
                                        autoComplete="given-name"
                                        required
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="last_name"
                                        className="block font-medium text-foreground/80"
                                    >
                                        Last Name
                                    </label>

                                    <input
                                        id="last_name"
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleTextChange}
                                        placeholder="Enter last name"
                                        autoComplete="family-name"
                                        required
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <SelectInput
                                        name="gender"
                                        label="Gender"
                                        value={form.gender}
                                        onChange={(value) =>
                                            setForm((previous) => ({
                                                ...previous,
                                                gender: value,
                                            }))
                                        }
                                        options={[
                                            {
                                                label: "Male",
                                                value: "Male",
                                            },
                                            {
                                                label: "Female",
                                                value: "Female",
                                            },
                                        ]}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <SelectInput
                                        name="department"
                                        label="Department"
                                        value={form.department}
                                        onChange={handleDepartmentChange}
                                        options={departments.map(
                                            (department) => ({
                                                label: department.name,
                                                value: department.name,
                                            })
                                        )}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <SelectInput
                                        name="academic_program"
                                        label="Academic Program / Course"
                                        value={form.academic_program}
                                        onChange={handleCourseChange}
                                        options={availableCourses.map(
                                            (course) => ({
                                                label: course.name,
                                                value: course.name,
                                            })
                                        )}
                                        required
                                    />

                                    {form.department &&
                                        availableCourses.length === 0 && (
                                            <p className="text-xs text-amber-600">
                                                No courses are available for
                                                this department.
                                            </p>
                                        )}
                                </div>

                                <div className="space-y-1.5">
                                    <SelectInput
                                        name="year_level"
                                        label="Year Level"
                                        value={form.year_level}
                                        onChange={(value) =>
                                            setForm((previous) => ({
                                                ...previous,
                                                year_level: value,
                                            }))
                                        }
                                        options={[
                                            {
                                                label: "1st Year",
                                                value: "1st Year",
                                            },
                                            {
                                                label: "2nd Year",
                                                value: "2nd Year",
                                            },
                                            {
                                                label: "3rd Year",
                                                value: "3rd Year",
                                            },
                                            {
                                                label: "4th Year",
                                                value: "4th Year",
                                            },
                                        ]}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <p
                            role="alert"
                            className="flex items-start gap-2 rounded-xl bg-red-500/5 p-3 text-sm text-red-500"
                        >
                            <AlertCircle
                                size={16}
                                className="mt-0.5 shrink-0"
                            />
                            <span>{error}</span>
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-2 border-t border-foreground/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border border-foreground/20 bg-white px-4 py-2.5 font-medium transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                loadingOptions ||
                                departments.length === 0
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? "Adding student..."
                                : "Add Student"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
