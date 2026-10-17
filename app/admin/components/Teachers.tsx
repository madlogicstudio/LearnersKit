
'use client'

import { Plus, Search, X, Trash2, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";
import AddTeacherForm from "@/components/dashboard/AddTeacherForm";
import { getTeachers } from "@/lib/actions/getTeachers";
import { deleteTeacher } from "@/lib/actions/deleteTeacher";
import { WanderingEyes } from "@/components/ui/WanderingEyes";

type Teacher = {
    id: string;
    teacher_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string | null;
    department: string | null;
    academic_program: string | null;
    employment_status: string | null;
};

function Teachers() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addTeacher, setAddTeacher] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const filteredTeachers = teachers.filter((teacher) => {
        const query = searchTerm.trim().toLowerCase();

        return (
            `${teacher.first_name} ${teacher.last_name}`
                .toLowerCase()
                .includes(query) ||
            teacher.teacher_number.toLowerCase().includes(query) ||
            teacher.email.toLowerCase().includes(query)
        );
    });

    async function fetchTeachers() {
        try {
            setLoading(true);
            setError("");

            const data = await getTeachers();
            setTeachers(data as Teacher[]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch teachers."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTeachers();
    }, []);

    function openDeleteConfirmation(teacher: Teacher) {
        setSelectedTeacher(teacher);
        setDeleteError("");
        setShowConfirmDelete(true);
    }

    function closeDeleteConfirmation() {
        if (deleting) return;

        setShowConfirmDelete(false);
        setSelectedTeacher(null);
        setDeleteError("");
    }

    async function handleDeleteTeacher() {
        if (!selectedTeacher || deleting) return;

        setDeleting(true);
        setDeleteError("");

        try {
            await deleteTeacher(selectedTeacher.id);

            setTeachers((prev) =>
                prev.filter(
                    (teacher) => teacher.id !== selectedTeacher.id
                )
            );

            setShowConfirmDelete(false);
            setSelectedTeacher(null);
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete teacher. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p role="alert" className="text-red-500">{error}</p>
                <button
                    type="button"
                    onClick={fetchTeachers}
                    className="mt-3 rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-white"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <section className="h-full w-full flex flex-col gap-3 p-3 overflow-auto hide-scrollbar">

            <div className="flex sm:flex-row flex-col sm:items-end items-start justify-between sm:gap-3 gap-6 p-3">
                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Teachers
                    </h1>
                    <span className="text-md text-foreground/60">
                        Manage teacher profiles, departments, and academic assignments.
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setAddTeacher(true)}
                    className="flex shrink-0 flex-row items-center px-3 py-2 gap-2 rounded-full bg-white shadow-sm dark:border dark:border-gray-800 dark:bg-[var(--card)] cursor-pointer transition hover:shadow-md"
                >
                    <Plus size={16} className="text-foreground/80" />
                    <span className="text-sm text-foreground/80">
                        Add Teacher
                    </span>
                </button>
            </div>

            <div className="h-auto flex flex-col gap-3 sm:p-6 p-3 rounded-xl border border-foreground/10 bg-white shadow-sm dark:bg-[var(--card)]">

                <span className="font-medium text-xl text-foreground">All Teachers</span>     
                <span className="text-md text-foreground/60">
                    Browse, search, and manage teacher records.
                </span>

                <div className="flex flex-row items-center gap-3 w-full border border-foreground/20 px-3 py-2 rounded-full my-3">
                    <Search size={18} className="text-foreground/60" />

                    <input
                        type="search"
                        placeholder="Search name, teacher ID, or email..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent outline-none text-sm text-foreground"
                    />

                    {searchTerm && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearchTerm("")}
                            className="text-foreground/50 hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="font-sans mb-6 mt-3 border-t border-foreground/20 py-6">

                    <div className="mb-4 flex flex-row items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">Teachers</h2>

                        <p className="text-sm text-foreground/60">
                            {filteredTeachers.length}{" "}
                            {filteredTeachers.length === 1
                                ? "teacher"
                                : "teachers"}
                        </p>
                    </div>

                    {filteredTeachers.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/15">
                                <Search size={22} className="text-foreground/60" />
                            </div>

                            <p className="font-medium text-foreground">
                                {searchTerm
                                    ? "No matching teachers found."
                                    : "No teachers found."}
                            </p>

                            <p className="mt-1 text-sm text-foreground/60">
                                {searchTerm
                                    ? "Try another name, teacher ID, or email."
                                    : "Add a teacher to get started."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 md:hidden">
                                {filteredTeachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        className="rounded-xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-foreground">
                                                    {teacher.first_name}{" "}
                                                    {teacher.last_name}
                                                </h3>

                                                <p className="mt-1 text-xs text-foreground/60">
                                                    {teacher.teacher_number}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-medium text-foreground">
                                                {teacher.employment_status || "N/A"}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 text-sm">

                                            <div className="min-w-0">
                                                <p className="mb-1 text-xs text-foreground/50">
                                                    Email
                                                </p>
                                                <p className="break-all text-foreground/80">
                                                    {teacher.email}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="min-w-0">
                                                    <p className="mb-1 text-xs text-foreground/50">
                                                        Gender
                                                    </p>
                                                    <p className="break-words text-foreground/80">
                                                        {teacher.gender || "—"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="mb-1 text-xs text-foreground/50">
                                                        Academic Program
                                                    </p>
                                                    <p className="break-words text-foreground/80">
                                                        {teacher.academic_program || "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-1 text-xs text-foreground/50">
                                                    Department
                                                </p>
                                                <p className="break-words text-foreground/80">
                                                    {teacher.department || "—"}
                                                </p>
                                            </div>

                                            <div className="border-t border-foreground/10 pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteConfirmation(teacher)
                                                    }
                                                    className="flex items-center gap-2 text-sm text-red-500 transition-colors hover:text-red-700"
                                                >
                                                    <Trash2 size={15} />
                                                    Delete teacher
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden overflow-x-auto rounded-xl border border-foreground/10 md:block">
                                <table className="w-full min-w-[1000px] text-left text-sm">
                                    <thead className="bg-gray-50 text-foreground/70 dark:bg-[var(--background)]">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Teacher No.
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                First Name
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Last Name
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Gender
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Department
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Academic Program
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Employment Status
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-foreground/10">
                                        {filteredTeachers.map((teacher) => (
                                            <tr
                                                key={teacher.id}
                                                className="transition-colors hover:bg-[var(--primary)]/10"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 font-medium">
                                                    {teacher.teacher_number}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {teacher.first_name}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {teacher.last_name}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {teacher.email}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {teacher.gender || "—"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {teacher.department || "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {teacher.academic_program || "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {teacher.employment_status || "—"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteConfirmation(teacher)
                                                        }
                                                        className="cursor-pointer   inline-flex items-center gap-1.5 text-red-500 transition-colors hover:text-red-700"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {addTeacher && (
                <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm">
                    <AddTeacherForm
                        setAddTeacher={setAddTeacher}
                        onTeacherAdded={fetchTeachers}
                    />
                </div>
            )}

            {showConfirmDelete && selectedTeacher && (
                <div
                    className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onClick={closeDeleteConfirmation}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        aria-describedby="delete-description"
                        className="w-full max-w-md rounded-xl border border-foreground/10 bg-white p-6 shadow-xl dark:bg-[var(--card)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex w-full items-start justify-between">
                            <button
                                type="button"
                                onClick={closeDeleteConfirmation}
                                disabled={deleting}
                                aria-label="Close confirmation"
                                className="cursor-pointer ml-auto rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h2
                            id="delete-title"
                            className="text-lg font-semibold text-foreground"
                        >
                            Delete teacher?
                        </h2>

                        <p
                            id="delete-description"
                            className="mt-2 text-sm leading-6 text-foreground/60"
                        >
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {selectedTeacher.first_name}{" "}
                                {selectedTeacher.last_name}
                            </span>{" "}
                            ({selectedTeacher.teacher_number})? This action
                            cannot be undone.
                        </p>

                        {deleteError && (
                            <p
                                role="alert"
                                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            >
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteTeacher}
                                disabled={deleting}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? (
                                    <>
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete teacher
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Teachers;
