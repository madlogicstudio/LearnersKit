"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, LoaderCircle } from "lucide-react";
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

type AddStudentFormProps = {
    setAddStudent: React.Dispatch<React.SetStateAction<boolean>>;
    onStudentAdded: () => Promise<void>;
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

export default function AddStudentForm({
    setAddStudent,
    onStudentAdded,
}: AddStudentFormProps) {
    const supabase = useMemo(() => createClient(), []);

    const [form, setForm] = useState(initialForm);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    // Only show courses belonging to the selected department.
    const availableCourses = useMemo(() => {
        const selectedDepartment = departments.find(
            (department) => department.name === form.department
        );

        if (!selectedDepartment) return [];

        return courses.filter(
            (course) =>
                course.department_id === selectedDepartment.id
        );
    }, [departments, courses, form.department]);

    function handleTextChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleDepartmentChange(value: string) {
        setForm((prev) => ({
            ...prev,
            department: value,
            academic_program: "",
        }));
    }

    function handleCourseChange(value: string) {
        setForm((prev) => ({
            ...prev,
            academic_program: value,
        }));
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!departments.some((d) => d.name === form.department)) {
                throw new Error("Please select a valid department.");
            }

            if (
                !availableCourses.some(
                    (course) => course.name === form.academic_program
                )
            ) {
                throw new Error("Please select a valid academic program.");
            }

            await createStudent(form);
            await onStudentAdded();

            setForm(initialForm);
            setAddStudent(false);
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

    return (
        <form
            onSubmit={handleSubmit}
            className="fadeIn mx-3 space-y-3 rounded-xl bg-white p-4 text-sm shadow-sm dark:border dark:border-foreground/10 dark:bg-[var(--card)] sm:mx-0 sm:p-6"
        >
            <div className="flex w-full items-center justify-between py-2 sm:py-3">
                <span className="text-lg font-semibold text-foreground/80">
                    Add Student
                </span>

                <button
                    type="button"
                    onClick={() => setAddStudent(false)}
                    aria-label="Close form"
                    className="rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E]"
                >
                    <X size={18} />
                </button>
            </div>

            {loadingOptions ? (
                <div className="flex items-center justify-center gap-2 py-6 text-foreground/60">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading departments and courses...
                </div>
            ) : (
                <>
                    <input
                        name="student_number"
                        value={form.student_number}
                        onChange={handleTextChange}
                        placeholder="Student number"
                        required
                        className="w-full rounded-lg border border-foreground/20 p-3 outline-[var(--primary)]"
                    />

                    <input
                        name="first_name"
                        value={form.first_name}
                        onChange={handleTextChange}
                        placeholder="First name"
                        required
                        className="w-full rounded-lg border border-foreground/20 p-3 outline-[var(--primary)]"
                    />

                    <input
                        name="last_name"
                        value={form.last_name}
                        onChange={handleTextChange}
                        placeholder="Last name"
                        required
                        className="w-full rounded-lg border border-foreground/20 p-3 outline-[var(--primary)]"
                    />

                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleTextChange}
                        placeholder="Email address"
                        required
                        className="w-full rounded-lg border border-foreground/20 p-3 outline-[var(--primary)]"
                    />

                    <SelectInput
                        name="gender"
                        label="Gender"
                        value={form.gender}
                        onChange={(value) =>
                            setForm((prev) => ({
                                ...prev,
                                gender: value,
                            }))
                        }
                        options={[
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                        ]}
                        required
                    />

                    <SelectInput
                        name="department"
                        label="Department"
                        value={form.department}
                        onChange={handleDepartmentChange}
                        options={departments.map((department) => ({
                            label: department.name,
                            value: department.name,
                        }))}
                        required
                    />

                    <SelectInput
                        name="academic_program"
                        label="Academic Program / Course"
                        value={form.academic_program}
                        onChange={handleCourseChange}
                        options={availableCourses.map((course) => ({
                            label: course.name,
                            value: course.name,
                        }))}
                        required
                    />

                    <SelectInput
                        name="year_level"
                        label="Year Level"
                        value={form.year_level}
                        onChange={(value) =>
                            setForm((prev) => ({
                                ...prev,
                                year_level: value,
                            }))
                        }
                        options={[
                            { label: "1st Year", value: "1st Year" },
                            { label: "2nd Year", value: "2nd Year" },
                            { label: "3rd Year", value: "3rd Year" },
                            { label: "4th Year", value: "4th Year" },
                        ]}
                        required
                    />
                </>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-500">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading || loadingOptions}
                className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading && (
                    <LoaderCircle size={16} className="animate-spin" />
                )}
                {loading ? "Adding student..." : "Add Student"}
            </button>
        </form>
    );
}
 