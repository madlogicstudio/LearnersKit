"use client";

import { useState } from "react";
import SelectInput from "../ui/SelectInput";
import { createStudent } from "@/lib/actions/addStudent";
import { X } from "lucide-react";

type AddStudentFrormProps = {
    setAddStudent: React.Dispatch<React.SetStateAction<boolean>>;
    onStudentAdded: () => Promise<void>;
}

export default function AddStudentForm({setAddStudent, onStudentAdded}: AddStudentFrormProps) {
    const [form, setForm] = useState({
        student_number: "",
        first_name: "",
        last_name: "",
        email: "",
        gender: "",
        department: "",
        year_level: "",
        academic_program:""
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
            await createStudent(form);

            setSuccess("Student added successfully!");

            setForm({
                student_number: "",
                first_name: "",
                last_name: "",
                email: "",
                gender: "",
                department: "",
                year_level: "",
                academic_program:""
            });

            await onStudentAdded();

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
        <form onSubmit={handleSubmit} className="fadeIn font-sans bg-white space-y-3 sm:p-6 p-4 sm:mx-0 mx-3 text-sm rounded-xl shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
            <div className="w-full flex flex-row items-center justify-between sm:py-3">
                <span className="text-lg text-foreground/80">Add Student</span>
                <div className="bg-[var(--primary)]/80 transition cursor-pointer text-white
                    items-center gap-3 rounded-lg p-2 hover:text-white hover:bg-[#24232E]"
                    onClick={() => setAddStudent(false)}>
                    <X size={18}/>
                </div>
            </div>
            <input
                name="student_number"
                value={form.student_number}
                onChange={handleChange}
                placeholder="Student number"
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
                    setForm((prev) => ({ ...prev, gender: value }))
                }
                options={[
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                ]}
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
                placeholder="Academic Program"
                className="w-full rounded-lg border p-3 border-foreground/20 outline-[var(--primary)]"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
                <p className="text-sm text-green-600">{success}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="rounded-lg py-3 text-white bg-[var(--primary)] hover:bg-[#24232E] text-sm px-4 py-3 cursor-pointer transition"
            >
                {loading ? "Adding student..." : "Add Student"}
            </button>
        </form>
    );
}
