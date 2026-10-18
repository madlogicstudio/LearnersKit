"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import AddDepartment from "@/components/adminDashboard/AddDepartment";
import AddCourse from "@/components/adminDashboard/AddCourse";
import DeleteDepartment from "@/components/adminDashboard/DeleteDepartment";
import {
    GraduationCap,
    Plus,
    Search,
    X,
    ChevronDown,
    Building2,
    MoreHorizontal,
    Pencil,
    Trash2,
    LoaderCircle,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Department = {
    id: string;
    name: string;
};

type Course = {
    id: string;
    name: string;
    department_id: string;
    created_at?: string;
};

type CourseWithDepartment = Course & {
    department?: Department;
};  

const emptyForm = {
    name: "",
    department_id: "",
};

export default function Courses() {
    const [courses, setCourses] = useState<CourseWithDepartment[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] =
        useState<CourseWithDepartment | null>(null);
    const [form, setForm] = useState(emptyForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [menuCourseId, setMenuCourseId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<CourseWithDepartment | null>(null);

    const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
    const [departmentForm, setDepartmentForm] = useState({
        name: "",
    });
    const [savingDepartment, setSavingDepartment] = useState(false);
    const [departmentError, setDepartmentError] = useState("");

    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const [departmentCourseCount, setDepartmentCourseCount] = useState(0);
    const [deletingDepartment, setDeletingDepartment] = useState(false);

    const supabase = useMemo(() => createClient(), []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error("Please log in to manage courses.");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || profile?.role !== "admin") {
            throw new Error("Only administrators can manage courses.");
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
            .select("id, name, department_id, created_at")
            .eq("admin_id", user.id)
            .order("name"),
        ]);

        if (departmentError) throw departmentError;
        if (courseError) throw courseError;

        const departmentList = (departmentData ?? []) as Department[];
        const courseList = (courseData ?? []) as Course[];

        setDepartments(departmentList);
        setCourses(
            courseList.map((course) => ({
            ...course,
            department: departmentList.find(
                (department) => department.id === course.department_id
            ),
            }))
        );
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Unable to load courses."
        );
        } finally {
        setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredCourses = courses.filter((course) => {
        const query = search.toLowerCase().trim();

        const matchesSearch =
        course.name.toLowerCase().includes(query) ||
        (course.department?.name ?? "").toLowerCase().includes(query);

        const matchesDepartment =
        departmentFilter === "all" ||
        course.department_id === departmentFilter;

        return matchesSearch && matchesDepartment;
    });

    function openAddModal(departmentId = "") {
        setEditingCourse(null);
        setForm({
        ...emptyForm,
        department_id:
            departmentId || (departmentFilter !== "all" ? departmentFilter : ""),
        });
        setError("");
        setSuccess("");
        setIsDepartmentModalOpen(false);
        setIsModalOpen(true);
    }

    function openEditModal(course: CourseWithDepartment) {
        setEditingCourse(course);
        setForm({
        name: course.name,
        department_id: course.department_id,
        });
        setError("");
        setSuccess("");
        setMenuCourseId(null);
        setIsModalOpen(true);
    }

    async function handleCreateDepartment(
        event: React.FormEvent<HTMLFormElement>
        ) {
        event.preventDefault();
        setDepartmentError("");

        const name = departmentForm.name.trim();

        if (!name) {
            setDepartmentError("Please enter a department name.");
            return;
        }

        setSavingDepartment(true);

        try {
            const {
            data: { user },
            error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
            throw new Error("Please log in again.");
            }

            const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

            if (profileError || profile?.role !== "admin") {
            throw new Error("Only administrators can create departments.");
            }

            const { data: newDepartment, error: insertError } = await supabase
            .from("departments")
            .insert({
                name,
                admin_id: user.id,
            })
            .select("id, name")
            .single();

            if (insertError) throw insertError;

            setIsDepartmentModalOpen(false);
            setDepartmentForm({ name: "" });

            await loadData();

            setDepartmentFilter(newDepartment.id);
            setSuccess("Department created successfully.");
        } catch (err) {
            setDepartmentError(
            err instanceof Error
                ? err.message
                : "Unable to create department."
            );
        } finally {
            setSavingDepartment(false);
        }
    }

    async function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.name.trim() || !form.department_id) {
        setError("Please enter a course name and select a department.");
        return;
        }

        setSaving(true);

        try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error("Your session has expired. Please log in again.");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || profile?.role !== "admin") {
            throw new Error("Only administrators can manage courses.");
        }

        const { data: department, error: verifyError } = await supabase
            .from("departments")
            .select("id")
            .eq("id", form.department_id)
            .eq("admin_id", user.id)
            .single();

        if (verifyError || !department) {
            throw new Error("Please select a valid department.");
        }

        if (editingCourse) {
            const { data, error: updateError } = await supabase
            .from("courses")
            .update({
                name: form.name.trim(),
                department_id: form.department_id,
            })
            .eq("id", editingCourse.id)
            .eq("admin_id", user.id)
            .select("id");

            if (updateError) throw updateError;

            if (!data?.length) {
            throw new Error(
                "Course not found or you don't have permission to edit it."
            );
            }

            setSuccess("Course updated successfully.");
        } else {
            const { error: insertError } = await supabase
            .from("courses")
            .insert({
                name: form.name.trim(),
                department_id: form.department_id,
                admin_id: user.id,
            });

            if (insertError) {
                console.error("Department creation failed:", {
                    message: insertError.message,
                    code: insertError.code,
                    details: insertError.details,
                    hint: insertError.hint,
                });

                throw new Error(insertError.message);
            }

            setSuccess("Course added successfully.");
        }

        setIsModalOpen(false);
        setForm(emptyForm);
        setEditingCourse(null);

        await loadData();
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Unable to save course."
        );
        } finally {
        setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        setError("");
        setSuccess("");

        try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error("Please log in again.");
        }

        const { data, error: deleteError } = await supabase
            .from("courses")
            .delete()
            .eq("id", deleteTarget.id)
            .eq("admin_id", user.id)
            .select("id");

        if (deleteError) throw deleteError;

        if (!data?.length) {
            throw new Error(
            "Course not found or you don't have permission to delete it."
            );
        }

        setDeleteTarget(null);
        setSuccess("Course deleted successfully.");
        await loadData();
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Unable to delete course."
        );
        setDeleteTarget(null);
        }
    }

    
    async function handleDeleteDepartment(department: Department) {
        setDepartmentError("");
        setSuccess("");
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please log in again.");
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Only administrators can delete departments.");
            }

            const { count, error: countError } = await supabase
                .from("courses")
                .select("id", { count: "exact", head: true })
                .eq("department_id", department.id)
                .eq("admin_id", user.id);

            if (countError) throw countError;

            if ((count ?? 0) > 0) {
                throw new Error(
                    "This department still has courses. Move or delete its courses first."
                );
            }

            const { data, error: deleteError } = await supabase
                .from("departments")
                .delete()
                .eq("id", department.id)
                .eq("admin_id", user.id)
                .select("id");

            if (deleteError) throw deleteError;

            if (!data?.length) {
                throw new Error(
                    "Department not found or you don't have permission to delete it."
                );
            }

            if (departmentFilter === department.id) {
                setDepartmentFilter("all");
            }

            setSuccess("Department deleted successfully.");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete department."
            );
        }
    }


    if (loading) {
        return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <WanderingEyes className="text-[var(--primary)]" />
        </div>
        );
    }

    return (
        <div className="min-h-full space-y-6 p-5 font-sans text-foreground sm:p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
                <span className="text-md text-foreground/60">
                    Manage academic programs and their departments.
                </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                    type="button"
                    onClick={() => {
                        setError("");
                        setSuccess("");
                        setDepartmentForm({ name: "" });
                        setIsDepartmentModalOpen(true);
                    }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm 
                        transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)] dark:hover:bg-white/10">
                        <Plus size={16} />
                        Create Department
                    </button>

                    <button
                        type="button"
                        onClick={() => openAddModal()}
                        disabled={departments.length === 0}
                        title={
                            departments.length === 0
                                ? "Create a department first"
                                : "Add a new course"
                        }
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm 
                            transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)] dark:hover:bg-white/10">
                        <Plus size={16} />
                        Add Course
                    </button>
                </div>
            </div>


            {error && !isModalOpen && !isDepartmentModalOpen && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
                <button
                    type="button"
                    onClick={() => setError("")}
                    className="ml-auto"
                    aria-label="Dismiss error"
                >
                    <X size={16} />
                </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                <CheckCircle2 size={17} />
                <span>{success}</span>
                <button
                    type="button"
                    onClick={() => setSuccess("")}
                    className="ml-auto"
                    aria-label="Dismiss success"
                >
                    <X size={16} />
                </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white p-6 dark:bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div>
                        <span className="text-lg font-medium text-foreground/70">
                            Total Courses
                        </span>
                        <p className="mt-2 text-3xl font-semibold">{courses.length}</p>
                        </div>
                        <div className="rounded-xl bg-[#C9A0DC]/10 p-3">
                        <GraduationCap size={24} className="text-[var(--primary)]" />
                        </div>
                    </div>
                    <span className="text-md text-foreground/60">
                        Academic programs registered
                    </span>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white p-6 dark:bg-[var(--card)]">
                    <div className="flex items-start justify-between">
                        <div>
                        <span className="text-lg font-medium text-foreground/70">
                            Departments
                        </span>
                        <p className="mt-2 text-3xl font-semibold">
                            {departments.length}
                        </p>
                        </div>
                        <div className="rounded-xl bg-[#C9A0DC]/10 p-3">
                        <Building2 size={24} className="text-[var(--primary)]" />
                        </div>
                    </div>
                    <span className="text-md text-foreground/60">
                        Departments available to your account
                    </span>
                </div>
            </div>

            <section className="overflow-visible rounded-xl border border-white/[0.07] bg-white dark:bg-[var(--card)]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground/80">
                        All Courses
                        </h2>
                        <p className="mt-1 text-md text-foreground/60">
                        Browse and manage your academic programs.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888491]"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search courses..."
                                className="w-full rounded-xl border border-foreground/20 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#777380] focus:border-[var(--secondary)] sm:w-56"
                            />
                        </div>

                        
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={departmentFilter}
                                    onChange={(event) =>
                                        setDepartmentFilter(event.target.value)
                                    }
                                    className="w-full cursor-pointer appearance-none rounded-xl bg-[var(--primary)] py-2.5 pl-3 pr-9 text-sm text-white outline-none focus:border-[#C9A0DC]/60 dark:bg-foreground/10 sm:w-56"
                                >
                                    <option value="all" className="text-[#24232E]">
                                        All Departments
                                    </option>

                                    {departments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                            className="text-[#24232E]"
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    const department = departments.find(
                                        (item) => item.id === departmentFilter
                                    );

                                    if (!department) return;

                                    const { data: { user } } = await supabase.auth.getUser();

                                    if (!user) {
                                        setError("Please sign in again.");
                                        return;
                                    }

                                    const { count, error } = await supabase
                                        .from("courses")
                                        .select("id", { count: "exact", head: true })
                                        .eq("admin_id", user.id)
                                        .eq("department_id", department.id);

                                    if (error) {
                                        setError("Unable to check the department's courses.");
                                        return;
                                    }

                                    setDepartmentCourseCount(count ?? 0);
                                    setDepartmentToDelete(department);
                                }}
                                disabled={
                                    departmentFilter === "all" ||
                                    !departments.some(
                                        (item) => item.id === departmentFilter
                                    )
                                }
                                title="Delete selected department"
                                aria-label="Delete selected department"
                                className="cursor-pointer shrink-0 rounded-xl border border-red-400/20 p-2.5 text-red-500 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>
                    </div>
                </div>

                {departments.length === 0 && (
                    <div className="m-5 rounded-xl bg-[var(--primary)]/20 p-4 text-sm text-foreground/70">
                        Create a department before adding courses.
                    </div>
                )}

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] text-[#9995A2]">
                            <tr>
                                <th className="px-5 py-4 font-medium">Course</th>
                                <th className="px-5 py-4 font-medium">Department</th>
                                <th className="px-5 py-4 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.06]">
                            {filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-14 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                            <GraduationCap size={22} />
                                        </div>

                                        <p className="mt-3 text-lg font-medium">
                                            {courses.length === 0
                                                ? "No courses yet"
                                                : "No matching courses"}
                                        </p>

                                        <p className="mt-1 text-sm text-[#92909B]">
                                            {courses.length === 0
                                                ? "Create a department, then add your first course."
                                                : "Try another search or department."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="transition hover:bg-foreground/[0.025]"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="font-medium">
                                                {course.name}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-foreground/70">
                                            {course.department?.name ??
                                                "Department unavailable"}
                                        </td>

                                        <td className="relative px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMenuCourseId(
                                                        menuCourseId === course.id
                                                            ? null
                                                            : course.id
                                                    )
                                                }
                                                aria-label={`Actions for ${course.name}`}
                                                className="cursor-pointer rounded-lg p-2 text-[#A6A1AE] hover:bg-foreground/10 hover:text-foreground"
                                            >
                                                <MoreHorizontal size={19} />
                                            </button>

                                            {menuCourseId === course.id && (
                                                <div className="absolute right-12 top-10 z-20 w-44 rounded-xl border border-foreground/10 bg-white p-2 text-left shadow-xl dark:bg-[var(--card)]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(course)}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5"
                                                    >
                                                        <Pencil size={14} />
                                                        Edit course
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteTarget(course);
                                                            setMenuCourseId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-400/10"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete course
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                    {filteredCourses.length === 0 ? (
                        <div className="px-2 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                <GraduationCap size={22} />
                            </div>

                            <p className="mt-3 font-medium">
                                {courses.length === 0
                                    ? "No courses yet"
                                    : "No matching courses"}
                            </p>

                            <p className="mt-1 text-sm text-foreground/60">
                                {courses.length === 0
                                    ? "Create a department, then add your first course."
                                    : "Try another search or department."}
                            </p>
                        </div>
                    ) : (
                        filteredCourses.map((course) => (
                            <article
                                key={course.id}
                                className="relative rounded-xl border border-foreground/10 bg-white p-4 shadow-sm dark:bg-white/[0.02]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                        <GraduationCap size={21} />
                                    </div>

                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="break-words font-semibold text-foreground">
                                            {course.name}
                                        </h3>

                                        <p className="mt-1 text-xs text-foreground/50">
                                            DEPARTMENT
                                        </p>

                                        <p className="mt-0.5 break-words text-sm text-foreground/70">
                                            {course.department?.name ??
                                                "Department unavailable"}
                                        </p>
                                    </div>

                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMenuCourseId(
                                                    menuCourseId === course.id
                                                        ? null
                                                        : course.id
                                                )
                                            }
                                            aria-label={`Actions for ${course.name}`}
                                            aria-expanded={menuCourseId === course.id}
                                            className="cursor-pointer rounded-lg p-2 text-foreground/60 transition hover:bg-foreground/10 hover:text-foreground"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {menuCourseId === course.id && (
                                            <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-foreground/10 bg-white p-2 text-left shadow-xl dark:bg-[var(--card)]">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(course)}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5"
                                                >
                                                    <Pencil size={14} />
                                                    Edit course
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeleteTarget(course);
                                                        setMenuCourseId(null);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-400/10"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete course
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                <div className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-sm text-[#92909B] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Showing {filteredCourses.length} of {courses.length} courses
                    </span>
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        disabled={loading}
                        className="self-start rounded-lg px-2 py-1 hover:bg-foreground/5 hover:text-foreground disabled:opacity-50 sm:self-auto"
                    >
                        Refresh list
                    </button>
                </div>

            </section>

            {isDepartmentModalOpen && (
                <AddDepartment
                    isOpen={isDepartmentModalOpen}
                    onClose={() => {
                        if (savingDepartment) return;

                        setIsDepartmentModalOpen(false);
                        setDepartmentError("");
                    }}
                    onSubmit={handleCreateDepartment}
                    departmentName={departmentForm.name}
                    onDepartmentNameChange={(name) =>
                        setDepartmentForm({ name })
                    }
                    saving={savingDepartment}
                    error={departmentError}
                />
            )}

            {isModalOpen && (  
                <AddCourse
                    isOpen={isModalOpen}
                    onClose={() => {
                        if (saving) return;

                        setIsModalOpen(false);
                        setError("");
                    }}
                    onSubmit={handleSave}
                    courseName={form.name}
                    onCourseNameChange={(name) =>
                        setForm((previous) => ({
                            ...previous,
                            name,
                        }))
                    }
                    departmentId={form.department_id}
                    onDepartmentChange={(departmentId) =>
                        setForm((previous) => ({
                            ...previous,
                            department_id: departmentId,
                        }))
                    }
                    departments={departments}
                    saving={saving}
                    error={error}
                    isEditing={Boolean(editingCourse)}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-6 shadow-2xl dark:bg-[var(--card)]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-red-500">
                            <Trash2 size={22} />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold">Delete course?</h2>
                        <p className="mt-2 text-sm leading-6 text-foreground/60">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {deleteTarget.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        {error && (
                            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                            setDeleteTarget(null);
                            setError("");
                            }}
                            className="rounded-xl border border-foreground/15 px-4 py-2.5 text-sm transition hover:bg-foreground/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDelete()}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                            <Trash2 size={15} />
                            Delete Course
                        </button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteDepartment
                isOpen={departmentToDelete !== null}
                departmentName={departmentToDelete?.name ?? ""}
                courseCount={departmentCourseCount}
                deleting={deletingDepartment}
                onClose={() => {
                    if (!deletingDepartment) {
                    setDepartmentToDelete(null);
                    }
                }}
                onConfirm={async () => {
                    if (!departmentToDelete || departmentCourseCount > 0) return;

                    setDeletingDepartment(true);

                    try {
                    await handleDeleteDepartment(departmentToDelete);
                    setDepartmentToDelete(null);
                    } finally {
                    setDeletingDepartment(false);
                    }
                }}
            />

        </div>
    );
}
