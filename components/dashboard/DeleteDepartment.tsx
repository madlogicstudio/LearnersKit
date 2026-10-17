"use client";

import { AlertTriangle, X, Trash2, LoaderCircle } from "lucide-react";

type DeleteDepartmentProps = {
    isOpen: boolean;
    departmentName: string;
    courseCount: number;
    deleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function DeleteDepartment({
    isOpen,
    departmentName,
    courseCount,
    deleting,
    onClose,
    onConfirm,
}: DeleteDepartmentProps) {
    if (!isOpen) return null;

    const hasCourses = courseCount > 0;

    return (
        <div className="font-sans fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-[var(--card)] p-6 flex flex-col gap-3">

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        Delete Department
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        aria-label="Close course modal"
                        className="cursor-pointer rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="">

                    <h3 className="mt-6 mb-2 text-md font-semibold text-foreground/80">
                        Are you sure you want to delete this department?
                    </h3>

                    <p className="text-md leading-6 text-foreground/80">
                        You are about to delete{" "}
                        <span className="font-semibold text-foreground">
                        {departmentName}
                        </span>
                        . This action cannot be undone.
                    </p>

                    {hasCourses ? (
                        <div className="mt-4">
                            <p className="text-md font-medium text-foreground/80">
                                This department has {courseCount}{" "}
                                {courseCount === 1 ? "course" : "courses"} assigned.
                            </p>
                            <p className="mt-1 text-md leading-5 text-foreground/80">
                                Move or delete its courses before deleting this department.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                            <p className="text-md text-foreground/80">
                                No courses are assigned to this department. It is ready to be
                                deleted.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={hasCourses || deleting}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {deleting ? (
                        <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                        <Trash2 size={16} />
                        )}
                        {deleting ? "Deleting..." : "Delete Department"}
                    </button>
                </div>
            </div>
        </div>
    );
}