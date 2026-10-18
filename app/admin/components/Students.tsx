'use client'

import { Plus, Search, X, Trash2, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";
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

    async function fetchStudents() {
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
    }

    useEffect(() => {
        fetchStudents();
    }, []);

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <WanderingEyes className="text-[var(--primary)]" />
        </div>);
    if (error) return <p className="text-red-500">{error}</p>;


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

            setStudents((prev) =>
                prev.filter((student) => student.id !== selectedStudent.id)
            );

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

    return (
        <section className='h-full w-full flex flex-col gap-3 p-3 overflow-auto hide-scrollbar'>

            <div className="flex sm:flex-row flex-col sm:items-end items-start justify-between sm:gap-3 gap-6 p-3">

                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Students
                    </h1>
                    <span className="text-md text-foreground/60">
                        Manage student profiles, academic information, and records.
                    </span>
                </div>

                <div className="flex flex-row items-center px-3 py-2 gap-2 rounded-full bg-white shadow-sm dark:border-gray-800 cursor-pointer dark:bg-[var(--card)]"
                    onClick={() => setAddStudent(true)}>
                    <Plus size={16} className="text-foreground/80" />
                    <span className="text-sm text-foreground/80">Add Student</span>
                </div>

            </div>

            <div className="h-auto flex flex-col gap-3 sm:p-6 p-3 rounded-xl border border-foreground/10 bg-white shadow-sm dark:border-foreground/10 dark:bg-[var(--card)]">
                <span className="font-medium text-xl text-foreground">All Students</span>
                <span className="text-md text-foreground/60">
                    Browse, search, filter, and manage student records.
                </span> 
                <div className="flex-1 flex flex-row items-center gap-3 w-full border border-foreground/20 px-3 py-2 rounded-full my-3">
                    <Search size={18} className="text-foreground/80 cursor-pointer" />
                    <input type="search" placeholder="Search name, student id or email ..." value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full outline-none text-sm" />
                </div>  
                
                <div className="font-sans mb-6 mt-3 border-t border-foreground/20 py-6">
                    <div className="mb-4 flex flex-row items-center justify-between gap-3">
                        <h1 className="text-lg font-semibold">Students</h1>
                        <p className="text-sm text-foreground/60">
                            {filteredStudents.length}{" "}
                            {filteredStudents.length === 1
                                ? "student"
                                : "students"}
                        </p>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/15">
                                <Search size={22} className="text-foreground/60" />
                            </div>

                            <p className="font-medium text-foreground">
                                {searchTerm
                                    ? "No matching student found."
                                    : "No students found."}
                            </p>

                            <p className="mt-1 text-sm text-foreground/60">
                                {searchTerm
                                    ? "Try another name, teacher ID, or email."
                                    : "Add a student to get started."}  
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Student cards */}
                            <div className="font-sans flex flex-col gap-3 md:hidden">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="rounded-xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-[var(--card)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h2 className="font-medium text-foreground">
                                                    {student.first_name} {student.last_name}
                                                </h2>
                                                <p className="mt-1 text-xs text-foreground/60">
                                                    {student.student_number}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-medium text-foreground">
                                                {student.year_level || "N/A"}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 text-sm">
                                            <div className="min-w-0">
                                                <p className="text-xs text-foreground/50 mb-2">
                                                    Email
                                                </p>
                                                <p className="break-all text-foreground/80">
                                                    {student.email}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs text-foreground/50 mb-2">
                                                        Gender
                                                    </p>
                                                    <p className="break-words text-foreground/80">
                                                        {student.gender || "—"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs text-foreground/50 mb-2">
                                                        Academic Program
                                                    </p>
                                                    <p className="break-words text-foreground/80">
                                                        {student.academic_program || "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs text-foreground/50 mb-2">
                                                    Department
                                                </p>
                                                <p className="break-words text-foreground/80">
                                                    {student.department || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-foreground/50 mb-2">
                                                    Actions
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteConfirmation(student)}
                                                    className="text-red-500 transition-colors hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop and tablet: Table */}
                            <div className="font-sans hidden overflow-x-auto rounded-xl border border-foreground/10 md:block">
                                <table className="w-full min-w-[1000px] text-left text-sm">
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
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-foreground/10">
                                        {filteredStudents.map((student) => (
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
                                                <td className="px-4 py-3">
                                                    {student.email}
                                                </td>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteConfirmation(student)}
                                                        className="text-red-500 transition-colors hover:text-red-700 cursor-pointer"
                                                    >
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

            {addStudent &&  
                <div className="h-screen w-full bg-[rgba(0,0,0,0.3)] absolute top-0 left-0 z-20 backdrop-blur-sm flex flex-col items-center justify-center">
                    <AddStudentForm setAddStudent={setAddStudent} onStudentAdded={fetchStudents}/>
                </div>
            }

            {showConfirmDelete && selectedStudent && (
                <div
                    className="font-sans fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
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
                        <div className="w-full flex items-start justify-between">
                            <button
                                type="button"
                                onClick={closeDeleteConfirmation}
                                disabled={deleting}
                                aria-label="Close confirmation"
                                className="ml-auto bg-[var(--primary)]/80 transition cursor-pointer text-white items-center gap-3 rounded-lg p-2 hover:text-white hover:bg-[#24232E]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h2
                            id="delete-title"
                            className="text-lg font-semibold text-foreground"
                        >
                            Delete student?
                        </h2>

                        <p
                            id="delete-description"
                            className="mt-2 text-sm leading-6 text-md text-foreground/60"
                        >
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {selectedStudent.first_name} {selectedStudent.last_name}
                            </span>
                            {" "}({selectedStudent.student_number})? This action cannot
                            be undone.
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
                                onClick={handleDeleteStudent}
                                disabled={deleting}
                                className="flex items-center justify-center gap-2 rounded-full cursor-pointer bg-[var(--primary)] hover:bg-[#24232E] transition
                                px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
                        </div>
                    </div>
                </div>
            )}

        </section>
    )       
}

export default Students