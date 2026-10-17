"use client";

import React from "react";
import {
    X,
    Plus,
    LoaderCircle,
    AlertCircle,
    GraduationCap,
    ChevronDown
} from "lucide-react";

type Department = {
    id: string;
    name: string;
};

type AddCourseProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    courseName: string;
    onCourseNameChange: (name: string) => void;
    departmentId: string;
    onDepartmentChange: (departmentId: string) => void;
    departments: Department[];
    saving: boolean;
    error: string;
    isEditing?: boolean;
};

export default function AddCourse({
    isOpen,
    onClose,
    onSubmit,
    courseName,
    onCourseNameChange,
    departmentId,
    onDepartmentChange,
    departments,
    saving,
    error,
    isEditing = false,
}: AddCourseProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <div className="my-auto w-full max-w-lg rounded-2xl border border-foreground/10 bg-white shadow-xl dark:bg-[var(--card)]">
                <div className="flex items-start justify-between border-b border-foreground/10 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {isEditing ? "Edit Course" : "Add Course"}
                            </h2>

                            <p className="mt-2 text-sm text-foreground/60">
                                {isEditing
                                    ? "Update the course information."
                                    : "Add an academic program to a department."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close course modal"
                        className="cursor-pointer rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
                    {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500">
                            <AlertCircle
                                size={17}
                                className="mt-0.5 shrink-0"
                            />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label
                            htmlFor="course-name"
                            className="text-sm font-medium"
                        >
                            Course Name{" "}
                            <span className="text-[#A77DC0]">*</span>
                        </label>

                        <input
                            id="course-name"
                            type="text"
                            value={courseName}
                            onChange={(event) =>
                                onCourseNameChange(event.target.value)
                            }
                            placeholder="e.g. BS Information Technology"
                            required
                            maxLength={150}
                            autoFocus
                            disabled={saving}
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-foreground/40 focus:border-[#C9A0DC] disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="course-department"
                            className="text-sm font-medium"
                        >
                            Department{" "}
                            <span className="text-[#A77DC0]">*</span>
                        </label>

                        <div className="relative mt-2">
                            <select
                                id="course-department"
                                value={departmentId}
                                onChange={(event) =>
                                    onDepartmentChange(event.target.value)
                                }
                                required
                                disabled={saving || departments.length === 0}
                                className="w-full appearance-none cursor-pointer rounded-xl border border-foreground/15 bg-white py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#C9A0DC] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141318]"
                            >
                                <option value="">Select department</option>

                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                        </div>

                        {departments.length === 0 && (
                            <p className="text-xs text-foreground/50">
                                Create a department before adding a course.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row gap-3 border-t border-foreground/10 pt-5">
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !courseName.trim() ||
                                !departmentId ||
                                departments.length === 0
                            }
                            className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {isEditing ? "Save Changes" : "Save"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
