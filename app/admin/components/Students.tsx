
"use client";

import {
    Plus,
    Search,
    X,
    Trash2,
    LoaderCircle,
    Copy,
    Check,
    KeyRound,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AddStudentForm from "@/components/adminDashboard/AddStudentForm";
import { getStudents } from "@/lib/actions/getStudents";
import { deleteStudent } from "@/lib/actions/deleteStudent";
import { WanderingEyes } from "@/components/ui/WanderingEyes";

type Student = {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string | null;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type StudentClaimCode = {
    code: string;
    copied?: boolean;
};

function Students() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addStudent, setAddStudent] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Claim codes are held in memory and are not persisted by this component.
    const [claimCodes, setClaimCodes] = useState<Record<string, StudentClaimCode>>({});

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getStudents();
            setStudents(data as Student[]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch students."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchStudents();
    }, [fetchStudents]);

    const filteredStudents = students.filter((student) => {
        const query = searchTerm.trim().toLowerCase();

        return (
            `${student.first_name} ${student.last_name}`
                .toLowerCase()
                .includes(query) ||
            student.student_number.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query)
        );
    });

    function handleClaimCodeGenerated(studentId: string, code: string) {
        setClaimCodes((previous) => ({
            ...previous,
            [studentId]: { code },
        }));
    }

    async function handleCopyCode(studentId: string) {
        const claimCode = claimCodes[studentId]?.code;
        if (!claimCode) return;

        try {
            await navigator.clipboard.writeText(claimCode);

            setClaimCodes((previous) => ({
                ...previous,
                [studentId]: {
                    ...previous[studentId],
                    copied: true,
                },
            }));

            window.setTimeout(() => {
                setClaimCodes((previous) => ({
                    ...previous,
                    [studentId]: {
                        ...previous[studentId],
                        copied: false,
                    },
                }));
            }, 2000);
        } catch {
            setError("Unable to copy the claim code. Please select and copy it manually.");
        }
    }

    function openDeleteConfirmation(student: Student) {
        setSelectedStudent(student);
        setDeleteError("");
        setShowConfirmDelete(true);
    }

    function closeDeleteConfirmation() {
        if (deleting) return;

        setShowConfirmDelete(false);
        setSelectedStudent(null);
        setDeleteError("");
    }

    async function handleDeleteStudent() {
        if (!selectedStudent || deleting) return;

        setDeleting(true);
        setDeleteError("");

        try {
            await deleteStudent(selectedStudent.id);

            setStudents((previous) =>
                previous.filter((student) => student.id !== selectedStudent.id)
            );

            setClaimCodes((previous) => {
                const updated = { ...previous };
                delete updated[selectedStudent.id];
                return updated;
            });

            setShowConfirmDelete(false);
            setSelectedStudent(null);
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete student. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <p role="alert" className="text-sm text-red-500">{error}</p>
                <button
                    type="button"
                    onClick={() => void fetchStudents()}
                    className="w-fit rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <section className="flex h-full w-full flex-col gap-3 overflow-auto p-3 hide-scrollbar">
            <div className="flex flex-col items-start justify-between gap-6 p-3 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Students
                    </h1>
                    <p className="text-sm text-foreground/60">
                        Manage student profiles, academic information, and records.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setAddStudent(true)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-85"
                >
                    <Plus size={16} />
                    Add Student
                </button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-white p-3 shadow-sm dark:bg-[var(--card)] sm:p-6">
                <h2 className="text-xl font-medium text-foreground">
                    All Students
                </h2>
                <p className="text-sm text-foreground/60">
                    Browse, search, and manage student records and claim codes.
                </p>

                <div className="my-3 flex w-full items-center gap-3 rounded-xl border border-foreground/20 px-3 py-3">
                    <Search size={18} className="shrink-0 text-foreground/60" />
                    <input
                        type="search"
                        placeholder="Search name, student number, or email..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/45"
                    />
                </div>

                <div className="mb-6 mt-3 border-t border-foreground/20 py-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold">Students</h3>
                        <p className="text-sm text-foreground/60">
                            {filteredStudents.length}{" "}
                            {filteredStudents.length === 1 ? "student" : "students"}
                        </p>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/15">
                                <Search size={22} className="text-foreground/60" />
                            </div>
                            <p className="font-medium text-foreground">
                                {searchTerm ? "No matching student found." : "No students found."}
                            </p>
                            <p className="mt-1 text-sm text-foreground/60">
                                {searchTerm
                                    ? "Try another name, student number, or email."
                                    : "Add a student to get started."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile student cards */}
                            <div className="flex flex-col gap-3 md:hidden">
                                {filteredStudents.map((student) => {
                                    const claim = claimCodes[student.id];

                                    return (
                                        <article
                                            key={student.id}
                                            className="rounded-xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-foreground">
                                                        {student.first_name} {student.last_name}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-foreground/60">
                                                        {student.student_number}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-medium text-foreground">
                                                    {student.year_level || "N/A"}
                                                </span>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 text-sm">
                                                <StudentInfo label="Email" value={student.email} />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <StudentInfo label="Gender" value={student.gender || "—"} />
                                                    <StudentInfo label="Academic Program" value={student.academic_program || "—"} />
                                                </div>
                                                <StudentInfo label="Department" value={student.department || "—"} />

                                                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
                                                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/60">
                                                        <KeyRound size={14} />
                                                        Student Claim Code
                                                    </p>
                                                    {claim ? (
                                                        <div className="flex items-center gap-2">
                                                            <code className="min-w-0 flex-1 break-all font-semibold tracking-wider">
                                                                {claim.code}
                                                            </code>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleCopyCode(student.id)}
                                                                aria-label="Copy student claim code"
                                                                className="rounded-lg border border-foreground/20 p-2 hover:bg-foreground/5"
                                                            >
                                                                {claim.copied ? <Check size={16} /> : <Copy size={16} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-foreground/50">
                                                            Code is not available in this session.
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteConfirmation(student)}
                                                    className="self-start text-sm font-medium text-red-500 transition-colors hover:text-red-700"
                                                >
                                                    Delete student
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* Desktop and tablet table */}
                            <div className="hidden overflow-x-auto rounded-xl border border-foreground/10 md:block">
                                <table className="w-full min-w-[1150px] text-left text-sm">
                                    <thead className="bg-gray-50 text-foreground/70 dark:bg-[var(--background)]">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Student No.</th>
                                            <th className="px-4 py-3 font-medium">First Name</th>
                                            <th className="px-4 py-3 font-medium">Last Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Gender</th>
                                            <th className="px-4 py-3 font-medium">Department</th>
                                            <th className="px-4 py-3 font-medium">Academic Program</th>
                                            <th className="px-4 py-3 font-medium">Year Level</th>
                                            <th className="px-4 py-3 font-medium">Claim Code</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-foreground/10">
                                        {filteredStudents.map((student) => {
                                            const claim = claimCodes[student.id];

                                            return (
                                                <tr
                                                    key={student.id}
                                                    className="transition-colors hover:bg-[var(--primary)]/10"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                                                        {student.student_number}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {student.first_name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {student.last_name}
                                                    </td>
                                                    <td className="px-4 py-3">{student.email}</td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {student.gender || "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {student.department || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {student.academic_program || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {student.year_level || "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {claim ? (
                                                            <div className="flex items-center gap-2">
                                                                <code className="max-w-36 break-all font-semibold tracking-wide">
                                                                    {claim.code}
                                                                </code>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleCopyCode(student.id)}
                                                                    aria-label="Copy student claim code"
                                                                    className="cursor-pointer rounded-lg border border-foreground/20 p-2 transition hover:bg-foreground/5"
                                                                >
                                                                    {claim.copied ? (
                                                                        <Check size={12} className="text-emerald-600" />
                                                                    ) : (
                                                                        <Copy size={12} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-foreground/50">
                                                                Not available
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteConfirmation(student)}
                                                            className="cursor-pointer text-red-500 transition-colors hover:text-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {addStudent && (
                <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/30 p-3 backdrop-blur-sm">
                    <div className="w-full max-w-2xl">
                        <AddStudentForm
                            setAddStudent={setAddStudent}
                            onStudentAdded={fetchStudents}
                            onClaimCodeGenerated={handleClaimCodeGenerated}
                        />
                    </div>
                </div>
            )}

            {showConfirmDelete && selectedStudent && (
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
                        <div className="mb-4 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={closeDeleteConfirmation}
                                disabled={deleting}
                                aria-label="Close confirmation"
                                className="rounded-xl border border-foreground/20 bg-white p-2.5 text-foreground transition hover:bg-foreground/5 disabled:opacity-50 dark:bg-[var(--card)]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h2 id="delete-title" className="text-lg font-semibold text-foreground">
                            Delete student?
                        </h2>

                        <p id="delete-description" className="mt-2 text-sm leading-6 text-foreground/60">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {selectedStudent.first_name} {selectedStudent.last_name}
                            </span>{" "}
                            ({selectedStudent.student_number})? This action cannot be undone.
                        </p>

                        {deleteError && (
                            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteStudent}
                                disabled={deleting}
                                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#24232E] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? (
                                    <>
                                        <LoaderCircle size={16} className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete student
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={closeDeleteConfirmation}
                                disabled={deleting}
                                className="rounded-xl border border-foreground/20 bg-white px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-50 dark:bg-[var(--card)]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function StudentInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="mb-1 text-xs text-foreground/50">{label}</p>
            <p className="break-words text-sm text-foreground/80">{value}</p>
        </div>
    );
}

export default Students;
