
"use client";

import { useState } from "react";
import SelectInput from "../ui/SelectInput";
import { createTeacher } from "@/lib/actions/addTeacher";
import { X } from "lucide-react";

type AddTeacherFormProps = {
    setAddTeacher: React.Dispatch<React.SetStateAction<boolean>>;
    onTeacherAdded: () => Promise<void>;
};

export default function AddTeacherForm({
    setAddTeacher,
    onTeacherAdded,
}: AddTeacherFormProps) {
    const [form, setForm] = useState({
        teacher_number: "",
        first_name: "",
        last_name: "",
        email: "",
        gender: "",
        department: "",
        academic_program: "",
        employment_status: "Active",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await createTeacher(form);

            setSuccess("Teacher added successfully!");

            setForm({
                teacher_number: "",
                first_name: "",
                last_name: "",
                email: "",
                gender: "",
                department: "",
                academic_program: "",
                employment_status: "Active",
            });

            await onTeacherAdded();
            setAddTeacher(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add teacher."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="fadeIn font-sans bg-white space-y-3 sm:p-6 p-4 sm:mx-0 mx-3 text-sm rounded-xl shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]"
        >
            <div className="w-full flex flex-row items-center justify-between sm:py-3">
                <span className="text-lg text-foreground/80">
                    Add Teacher
                </span>

                <button
                    type="button"
                    onClick={() => setAddTeacher(false)}
                    disabled={loading}
                    aria-label="Close form"
                    className="bg-[var(--primary)]/80 transition cursor-pointer text-white items-center gap-3 rounded-lg p-2 hover:bg-[#24232E] disabled:opacity-50"
                >
                    <X size={18} />
                </button>
            </div>

            <input
                name="teacher_number"
                value={form.teacher_number}
                onChange={handleChange}
                placeholder="Teacher number"
                required
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First name"
                required
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last name"
                required
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
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
                name="employment_status"
                label="Employment Status"
                value={form.employment_status}
                onChange={(value) =>
                    setForm((prev) => ({
                        ...prev,
                        employment_status: value,
                    }))
                }
                options={[
                    { label: "Active", value: "Active" },
                    { label: "Inactive", value: "Inactive" },
                    { label: "On Leave", value: "On Leave" },
                ]}
                required
            />

            <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            <input
                name="academic_program"
                value={form.academic_program}
                onChange={handleChange}
                placeholder="Academic program"
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            {error && (
                <p role="alert" className="text-sm text-red-500">
                    {error}
                </p>
            )}

            {success && (
                <p className="text-sm text-green-600">
                    {success}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="rounded-lg text-white bg-[var(--primary)] hover:bg-[#24232E] text-sm px-4 py-3 cursor-pointer transition disabled:opacity-50"
            >
                {loading ? "Adding teacher..." : "Add Teacher"}
            </button>
        </form>
    );
}
