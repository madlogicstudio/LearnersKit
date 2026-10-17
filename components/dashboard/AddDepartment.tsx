"use client";

import React from "react";
import {
  X,
  Plus,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

type AddDepartmentProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  departmentName: string;
  onDepartmentNameChange: (name: string) => void;
  saving: boolean;
  error: string;
};

export default function AddDepartment({
  isOpen,
  onClose,
  onSubmit,
  departmentName,
  onDepartmentNameChange,
  saving,
  error,
}: AddDepartmentProps) {
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
                    <div>
                        <h2 className="text-lg font-semibold">
                        Create Department
                        </h2>

                        <p className="mt-2 text-sm text-foreground/60">
                        Create a department before registering its courses.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close department modal"
                        className="bg-[var(--primary)]/80 transition cursor-pointer text-white items-center gap-3 rounded-lg p-2 hover:bg-[#24232E] disabled:opacity-50"
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
                        <label htmlFor="department-name" className="text-sm font-medium">
                            Department Name{" "}
                            <span className="text-[#A77DC0]">*</span>
                        </label>

                        <input
                            id="department-name"
                            type="text"
                            value={departmentName}
                            onChange={(event) =>
                                onDepartmentNameChange(event.target.value)
                            }
                            placeholder="e.g. College of Computer Studies"
                            required
                            maxLength={150}
                            autoFocus
                            disabled={saving}
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-foreground/40 focus:border-[#C9A0DC] disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-row gap-3 border-t border-foreground/10 pt-5">
                        <button
                            type="submit"
                            disabled={saving || !departmentName.trim()}
                            className="ml-auto rounded-lg text-white bg-[var(--primary)] hover:bg-[#24232E] text-sm px-4 py-3 cursor-pointer transition disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex flex-row items-center gap-2">
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Creating...
                                </div>
                            ) : (   
                                <>
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
