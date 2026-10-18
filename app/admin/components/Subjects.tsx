"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    BookOpen,
    Plus,
    Search,
    X,
    ChevronDown,
    GraduationCap,
    MoreHorizontal,
    Pencil,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Building2,
    Layers3,
    UserPlus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ManageStudentsModal from "./ManageStudentModal";

type Course = {
    id: string;
    name: string;
    department_id: string;
    department?: { name: string } | null;
};

type YearLevel = {
    id: string;
    course_id: string;
    admin_id: string;
    year_number: number;
    name: string;
    created_at?: string;
};

type Subject = {
    id: string;
    year_level_id: string;
    admin_id: string;
    name: string;
    code: string;
    created_at?: string;
};

const YEAR_OPTIONS = [
    { value: 1, label: "1st Year" },
    { value: 2, label: "2nd Year" },
    { value: 3, label: "3rd Year" },
    { value: 4, label: "4th Year" },
];

const emptyYearForm = {
    course_id: "",
    year_number: "1",
};

const emptySubjectForm = {
    year_level_id: "",
    name: "",
    code: "",
};

export default function Subjects() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [yearLevels, setYearLevels] = useState<YearLevel[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [selectedCourse, setSelectedCourse] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showYearModal, setShowYearModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);

    const [editingYear, setEditingYear] = useState<YearLevel | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const [yearForm, setYearForm] = useState(emptyYearForm);
    const [subjectForm, setSubjectForm] = useState(emptySubjectForm);

    const [menuId, setMenuId] = useState<string | null>(null);
    const [menuType, setMenuType] = useState<"year" | "subject" | null>(null);

    const [deleteYearTarget, setDeleteYearTarget] =
        useState<YearLevel | null>(null);
    const [deleteSubjectTarget, setDeleteSubjectTarget] =
        useState<Subject | null>(null);

    const supabase = useMemo(() => createClient(), []);

    const [managingSubject, setManagingSubject] = useState<{
        id: string;
        name: string;
        yearLevelId: string;
    } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please log in to manage subjects.");
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Only administrators can manage subjects.");
            }

            const [
                { data: courseData, error: courseError },
                { data: yearData, error: yearError },
                { data: subjectData, error: subjectError },
            ] = await Promise.all([
                supabase
                    .from("courses")
                    .select("id, name, department_id")
                    .eq("admin_id", user.id)
                    .order("name"),

                supabase
                    .from("year_levels")
                    .select(
                        "id, course_id, admin_id, year_number, name, created_at"
                    )
                    .eq("admin_id", user.id)
                    .order("year_number"),

                supabase
                    .from("subjects")
                    .select(
                        "id, year_level_id, admin_id, name, code, created_at"
                    )
                    .eq("admin_id", user.id)
                    .order("name"),
            ]);

            if (courseError) throw courseError;
            if (yearError) throw yearError;
            if (subjectError) throw subjectError;

            const courseList = (courseData ?? []) as Course[];
            const yearList = (yearData ?? []) as YearLevel[];
            const subjectList = (subjectData ?? []) as Subject[];

            const departmentIds = [
                ...new Set(
                    courseList
                        .map((course) => course.department_id)
                        .filter(Boolean)
                ),
            ];

            let departmentNames: Record<string, string> = {};

            if (departmentIds.length > 0) {
                const { data: departmentData, error: departmentError } =
                    await supabase
                        .from("departments")
                        .select("id, name")
                        .eq("admin_id", user.id)
                        .in("id", departmentIds);

                if (departmentError) throw departmentError;

                departmentNames = Object.fromEntries(
                    (departmentData ?? []).map((department) => [
                        department.id,
                        department.name,
                    ])
                );
            }

            setCourses(
                courseList.map((course) => ({
                    ...course,
                    department: course.department_id
                        ? {
                              name:
                                  departmentNames[course.department_id] ??
                                  "Department unavailable",
                          }
                        : null,
                }))
            );

            setYearLevels(yearList);
            setSubjects(subjectList);

            if (
                selectedCourse !== "all" &&
                !courseList.some((course) => course.id === selectedCourse)
            ) {
                setSelectedCourse("all");
                setSelectedYear("all");
            }

            if (
                selectedYear !== "all" &&
                !yearList.some((year) => year.id === selectedYear)
            ) {
                setSelectedYear("all");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load subjects."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase, selectedCourse, selectedYear]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const availableYears = yearLevels.filter(
        (year) =>
            selectedCourse === "all" || year.course_id === selectedCourse
    );

    const filteredSubjects = subjects.filter((subject) => {
        const year = yearLevels.find(
            (item) => item.id === subject.year_level_id
        );

        if (!year) return false;

        const course = courses.find(
            (item) => item.id === year.course_id
        );

        const query = search.toLowerCase().trim();

        const matchesSearch =
            subject.name.toLowerCase().includes(query) ||
            subject.code.toLowerCase().includes(query) ||
            (year.name ?? "").toLowerCase().includes(query) ||
            (course?.name ?? "").toLowerCase().includes(query);

        const matchesCourse =
            selectedCourse === "all" ||
            year.course_id === selectedCourse;

        const matchesYear =
            selectedYear === "all" ||
            year.id === selectedYear;

        return matchesSearch && matchesCourse && matchesYear;
    });

    const filteredYears = availableYears.filter(
        (year) =>
            selectedYear === "all" || year.id === selectedYear
    );

    function showMessage(message: string) {
        setSuccess(message);
        setError("");
    }

    function openAddYearModal() {
        setEditingYear(null);
        setYearForm({
            ...emptyYearForm,
            course_id: selectedCourse !== "all" ? selectedCourse : "",
        });
        setError("");
        setShowYearModal(true);
    }

    function openEditYearModal(year: YearLevel) {
        setEditingYear(year);
        setYearForm({
            course_id: year.course_id,
            year_number: String(year.year_number),
        });
        setMenuId(null);
        setError("");
        setShowYearModal(true);
    }

    function openAddSubjectModal(yearLevelId = "") {
        setEditingSubject(null);
        setSubjectForm({
            ...emptySubjectForm,
            year_level_id:
                yearLevelId ||
                (selectedYear !== "all" ? selectedYear : ""),
        });
        setError("");
        setShowSubjectModal(true);
    }

    function openEditSubjectModal(subject: Subject) {
        setEditingSubject(subject);
        setSubjectForm({
            year_level_id: subject.year_level_id,
            name: subject.name,
            code: subject.code,
        });
        setMenuId(null);
        setError("");
        setShowSubjectModal(true);
    }

    async function handleSaveYear(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!yearForm.course_id) {
            setError("Please select a course.");
            return;
        }

        const yearNumber = Number(yearForm.year_number);
        const yearName =
            YEAR_OPTIONS.find((option) => option.value === yearNumber)?.label;

        if (!yearName) {
            setError("Please select a valid year level.");
            return;
        }

        setSaving(true);

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
                throw new Error("Only administrators can manage year levels.");
            }

            const { data: course, error: courseError } = await supabase
                .from("courses")
                .select("id")
                .eq("id", yearForm.course_id)
                .eq("admin_id", user.id)
                .maybeSingle();

            if (courseError) throw courseError;

            if (!course) {
                throw new Error("Please select a valid course.");
            }

            if (editingYear) {
                const { data: updated, error: updateError } = await supabase
                    .from("year_levels")
                    .update({
                        course_id: yearForm.course_id,
                        year_number: yearNumber,
                        name: yearName,
                    })
                    .eq("id", editingYear.id)
                    .eq("admin_id", user.id)
                    .select("id");

                if (updateError) throw updateError;

                if (!updated?.length) {
                    throw new Error("Unable to update this year level.");
                }

                showMessage("Year level updated successfully.");
            } else {
                const { error: insertError } = await supabase
                    .from("year_levels")
                    .insert({
                        course_id: yearForm.course_id,
                        admin_id: user.id,
                        year_number: yearNumber,
                        name: yearName,
                    });

                if (insertError?.code === "23505") {
                    throw new Error(
                        "This course already has that year level."
                    );
                }

                if (insertError) throw insertError;

                showMessage("Year level created successfully.");
            }

            setShowYearModal(false);
            setEditingYear(null);

            if (selectedCourse !== yearForm.course_id) {
                setSelectedCourse(yearForm.course_id);
            }

            setSelectedYear("all");

            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save year level."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveSubject(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const name = subjectForm.name.trim();
        const code = subjectForm.code.trim();

        if (!name || !code || !subjectForm.year_level_id) {
            setError("Please complete all subject fields.");
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
                throw new Error("Only administrators can manage subjects.");
            }

            const { data: year, error: yearError } = await supabase
                .from("year_levels")
                .select("id, course_id")
                .eq("id", subjectForm.year_level_id)
                .eq("admin_id", user.id)
                .maybeSingle();

            if (yearError) throw yearError;

            if (!year) {
                throw new Error("Please select a valid year level.");
            }

            if (editingSubject) {
                const { data: updated, error: updateError } = await supabase
                    .from("subjects")
                    .update({
                        year_level_id: subjectForm.year_level_id,
                        name,
                        code,
                    })
                    .eq("id", editingSubject.id)
                    .eq("admin_id", user.id)
                    .select("id");

                if (updateError?.code === "23505") {
                    throw new Error(
                        "That subject code already exists in this year level."
                    );
                }

                if (updateError) throw updateError;

                if (!updated?.length) {
                    throw new Error("Unable to update this subject.");
                }

                showMessage("Subject updated successfully.");
            } else {
                const { error: insertError } = await supabase
                    .from("subjects")
                    .insert({
                        year_level_id: subjectForm.year_level_id,
                        admin_id: user.id,
                        name,
                        code,
                    });

                if (insertError?.code === "23505") {
                    throw new Error(
                        "That subject code already exists in this year level."
                    );
                }

                if (insertError) throw insertError;

                showMessage("Subject added successfully.");
            }

            setShowSubjectModal(false);
            setEditingSubject(null);
            setSubjectForm(emptySubjectForm);

            if (selectedCourse !== year.course_id) {
                setSelectedCourse(year.course_id);
            }

            setSelectedYear(year.id);

            await loadData();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to save subject."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSubject() {
        if (!deleteSubjectTarget) return;

        setDeleting(true);
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
                .from("subjects")
                .delete()
                .eq("id", deleteSubjectTarget.id)
                .eq("admin_id", user.id)
                .select("id");

            if (deleteError) throw deleteError;

            if (!data?.length) {
                throw new Error("Unable to delete this subject.");
            }

            setDeleteSubjectTarget(null);
            showMessage("Subject deleted successfully.");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to delete subject."
            );
            setDeleteSubjectTarget(null);
        } finally {
            setDeleting(false);
        }
    }

    async function handleDeleteYear() {
        if (!deleteYearTarget) return;

        setDeleting(true);
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

            const { count, error: countError } = await supabase
                .from("subjects")
                .select("id", { count: "exact", head: true })
                .eq("year_level_id", deleteYearTarget.id)
                .eq("admin_id", user.id);

            if (countError) throw countError;

            if ((count ?? 0) > 0) {
                throw new Error(
                    "This year level still has subjects. Delete or move its subjects first."
                );
            }

            const { data, error: deleteError } = await supabase
                .from("year_levels")
                .delete()
                .eq("id", deleteYearTarget.id)
                .eq("admin_id", user.id)
                .select("id");

            if (deleteError) throw deleteError;

            if (!data?.length) {
                throw new Error("Unable to delete this year level.");
            }

            setDeleteYearTarget(null);
            setSelectedYear("all");
            showMessage("Year level deleted successfully.");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete year level."
            );
            setDeleteYearTarget(null);
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

    return (
        <div className="min-h-full overflow-y-auto hide-scrollbar space-y-6 p-5 font-sans text-foreground sm:p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Subjects
                    </h1>
                    <p className="text-sm text-foreground/60">
                        Organize subjects by course and year level.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={openAddYearModal}
                        disabled={courses.length === 0}
                        title={
                            courses.length === 0
                                ? "Create a course first"
                                : "Add a year level"
                        }
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm 
                            transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)] dark:hover:bg-white/10"
                    >
                        <Plus size={16} />
                        Add Year Level
                    </button>

                    <button
                        type="button"
                        onClick={() => openAddSubjectModal()}
                        disabled={yearLevels.length === 0}
                        title={
                            yearLevels.length === 0
                                ? "Create a year level first"
                                : "Add a subject"
                        }
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm 
                            transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)] dark:hover:bg-white/10"
                    >
                        <Plus size={16} />
                        Add Subject
                    </button>
                </div>
            </div>

            {error && !showYearModal && !showSubjectModal && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                    <CheckCircle2 size={17} />
                    <span className="flex-1">{success}</span>
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss success"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Total Subjects"
                    value={subjects.length}
                    description="Subjects registered"
                    icon={<BookOpen size={24} />}
                />
                <StatCard
                    title="Year Levels"
                    value={yearLevels.length}
                    description="Year levels configured"
                    icon={<Layers3 size={24} />}
                />
                <StatCard
                    title="Courses"
                    value={courses.length}
                    description="Courses available to your account"
                    icon={<GraduationCap size={24} />}
                />
            </div>

            <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white dark:bg-[var(--card)]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground/80">
                            Course Curriculum
                        </h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            Select a course and year level to manage subjects.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                        <div className="relative">
                            <GraduationCap
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                            <select
                                value={selectedCourse}
                                onChange={(event) => {
                                    setSelectedCourse(event.target.value);
                                    setSelectedYear("all");
                                    setMenuId(null);
                                }}
                                className="w-full cursor-pointer appearance-none rounded-xl border border-foreground/15 bg-transparent py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[var(--secondary)]"
                            >
                                <option value="all">All Courses</option>
                                {courses.map((course) => (
                                    <option
                                        key={course.id}
                                        value={course.id}
                                        className="text-[#24232E]"
                                    >
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(event) =>
                                    setSelectedYear(event.target.value)
                                }
                                className="w-full cursor-pointer appearance-none rounded-xl border border-foreground/15 bg-transparent py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[var(--secondary)]"
                            >
                                <option value="all">All Year Levels</option>
                                {availableYears.map((year) => (
                                    <option
                                        key={year.id}
                                        value={year.id}
                                        className="text-[#24232E]"
                                    >
                                        {courses.find(
                                            (course) =>
                                                course.id === year.course_id
                                        )?.name
                                            ? `${courses.find((course) => course.id === year.course_id)?.name} — ${year.name}`
                                            : year.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                        </div>

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888491]"
                            />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search subjects..."
                                className="w-full min-w-0 rounded-xl border border-foreground/20 bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#777380] focus:border-[var(--secondary)]"
                            />
                        </div>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="m-5 rounded-xl bg-[var(--primary)]/10 p-5 text-sm text-foreground/70">
                        <Building2 size={22} className="mb-2 text-[var(--primary)]" />
                        No courses available. Create a department and course first.
                    </div>
                ) : yearLevels.length === 0 ? (
                    <div className="m-5 rounded-xl bg-[var(--primary)]/10 p-5 text-sm text-foreground/70">
                        <Layers3 size={22} className="mb-2 text-[var(--primary)]" />
                        No year levels yet. Add a year level to your course before
                        creating subjects.
                    </div>
                ) : (
                    <div className="min-h-0 min-w-0 space-y-5 p-4 sm:p-5">
                        {filteredYears.map((year) => {
                            const course = courses.find(
                                (item) => item.id === year.course_id
                            );

                            const yearSubjects = filteredSubjects.filter(
                                (subject) => subject.year_level_id === year.id
                            );

                            const totalYearSubjects = subjects.filter(
                                (subject) => subject.year_level_id === year.id
                            ).length;

                            return (
                                <div
                                    key={year.id}
                                    className="rounded-xl border border-foreground/10"
                                >
                                    <div className="flex flex-col gap-6 border-b border-foreground/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1 flex items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C9A0DC]/15 text-[var(--primary)]">
                                                <GraduationCap size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold">
                                                    {year.name}
                                                </h3>
                                                <p className="mt-1 min-w-0 max-w-full text-sm text-foreground/60">
                                                    {course?.name ?? "Course unavailable"}
                                                    {course?.department?.name
                                                        ? ` · ${course.department.name}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-row items-center justify-between gap-3 sm:justify-end border-red-500">
                                            <span className="text-xs text-foreground/50">
                                                {totalYearSubjects}{" "}
                                                {totalYearSubjects === 1
                                                    ? "subject"
                                                    : "subjects"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAddSubjectModal(year.id)
                                                }
                                                className="inline-flex shrink-0 cursor-pointer items-center rounded-full bg-white dark:bg-[var(--primary)] px-4 py-2 
                                                    text-xs font-medium text-white transition hover:opacity-90 flex flex-row items-center gap-1"
                                            >
                                                <Plus size={14} />
                                                Add Subject
                                            </button>

                                            <button
                                                type="button"
                                                aria-label={`Year level actions for ${year.name}`}
                                                onClick={() => {
                                                    setMenuType("year");
                                                    setMenuId(
                                                        menuId === year.id
                                                            ? null
                                                            : year.id
                                                    );
                                                }}
                                                className="shrink-0 cursor-pointer rounded-lg p-2 text-foreground/50 hover:bg-foreground/5"
                                            >
                                                <MoreHorizontal size={19} />
                                            </button>
                                        </div>
                                    </div>

                                    {menuId === year.id &&
                                        menuType === "year" && (
                                            <div className="relative">
                                                <div className="absolute right-3 top-0 z-30 w-48 rounded-xl border border-foreground/10 bg-white p-2 shadow-xl dark:bg-[var(--card)]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditYearModal(year)
                                                        }
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/5"
                                                    >
                                                        <Pencil size={14} />
                                                        Edit year level
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteYearTarget(year);
                                                            setMenuId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-400/10"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete year level
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    {yearSubjects.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <BookOpen
                                                size={24}
                                                className="mx-auto text-[var(--primary)]"
                                            />
                                            <p className="mt-2 text-md font-medium">
                                                {totalYearSubjects === 0
                                                    ? "No subjects in this year level"
                                                    : "No matching subjects"}
                                            </p>
                                            <p className="mt-1 text-sm text-foreground/50">
                                                {totalYearSubjects === 0
                                                    ? "Add a subject to get started."
                                                    : "Try a different search term."}
                                            </p>
                                        </div>
                                    ) : (
                                        <>  
                                            <div className="hidden overflow-x-auto hide-scrollbar md:block">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-foreground/[0.02] text-[#9995A2]">
                                                        <tr>
                                                            <th className="px-4 py-3 font-medium">
                                                                Subject
                                                            </th>
                                                            <th className="px-4 py-3 font-medium">
                                                                Subject Code
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-foreground/[0.06]">
                                                        {yearSubjects.map((subject) => (
                                                            <tr
                                                                key={subject.id}
                                                                className="hover:bg-foreground/[0.025]"
                                                            >
                                                                <td className="px-4 py-4 font-medium">
                                                                    {subject.name}
                                                                </td>
                                                                <td className="px-4 py-4 text-foreground/60">
                                                                    {subject.code}
                                                                </td>
                                                                <td className="relative px-4 py-3 text-right">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Actions for ${subject.name}`}
                                                                        onClick={() => {
                                                                            setMenuType("subject");
                                                                            setMenuId(
                                                                                menuId === subject.id
                                                                                    ? null
                                                                                    : subject.id
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer rounded-lg p-2 text-foreground/50 hover:bg-foreground/10"
                                                                    >
                                                                        <MoreHorizontal size={19} />
                                                                    </button>

                                                                    {menuId === subject.id &&
                                                                        menuType === "subject" && (
                                                                            <div className="absolute right-14 top-0 z-30 w-48 rounded-xl border border-foreground/10 bg-white p-2 text-left shadow-xl dark:bg-[var(--card)]">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setManagingSubject({
                                                                                            id: subject.id,
                                                                                            name: subject.name,
                                                                                            yearLevelId: year.id,
                                                                                        })
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5"
                                                                                >
                                                                                    <UserPlus size={16} />
                                                                                    Manage Students
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openEditSubjectModal(subject)
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5"
                                                                                >
                                                                                    <Pencil size={14} />
                                                                                    Edit subject
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setDeleteSubjectTarget(subject);
                                                                                        setMenuId(null);
                                                                                    }}
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-400/10"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                    Delete subject
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {managingSubject && (
                                                    <ManageStudentsModal
                                                        subjectId={managingSubject.id}
                                                        subjectName={managingSubject.name}
                                                        yearLevelId={managingSubject.yearLevelId}
                                                        onClose={() => setManagingSubject(null)}
                                                        onUpdated={() => {
                                                            // Refresh subject enrollment counts here if displayed.
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div className="space-y-2 p-3 md:hidden">
                                                {yearSubjects.map((subject) => (
                                                    <div
                                                        key={subject.id}
                                                        className="flex items-start gap-3 rounded-xl border border-foreground/10 p-3"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A0DC]/10 text-[var(--primary)]">
                                                            <BookOpen size={19} />
                                                        </div>

                                                        <div className="min-w-0 flex-1 pt-0.5">
                                                            <p className="break-words text-sm font-medium">
                                                                {subject.name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-foreground/50">
                                                                Code: {subject.code}
                                                            </p>
                                                        </div>

                                                        <div className="relative shrink-0">
                                                            <button
                                                                type="button"
                                                                aria-label={`Actions for ${subject.name}`}
                                                                onClick={() => {
                                                                    setMenuType("subject");
                                                                    setMenuId(
                                                                        menuId === subject.id
                                                                            ? null
                                                                            : subject.id
                                                                    );
                                                                }}
                                                                className="cursor-pointer rounded-lg p-2 text-foreground/50 hover:bg-foreground/10"
                                                            >
                                                                <MoreHorizontal size={19} />
                                                            </button>

                                                            {menuId === subject.id &&
                                                                menuType === "subject" && (
                                                                    <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-foreground/10 bg-white p-2 shadow-xl dark:bg-[#29262F]">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openEditSubjectModal(subject)
                                                                            }
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5"
                                                                        >
                                                                            <Pencil size={14} />
                                                                            Edit subject
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setDeleteSubjectTarget(subject);
                                                                                setMenuId(null);
                                                                            }}
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-400/10"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                            Delete subject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        {filteredYears.length === 0 && (
                            <div className="py-12 text-center">
                                <Layers3
                                    size={28}
                                    className="mx-auto text-[var(--primary)]"
                                />
                                <p className="mt-3 font-medium">
                                    No year levels found
                                </p>
                                <p className="mt-1 text-sm text-foreground/50">
                                    Change your filters or add a year level.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-sm text-[#92909B] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Showing {filteredSubjects.length} of {subjects.length} subjects
                    </span>
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="self-start rounded-lg px-2 py-1 hover:bg-foreground/5 hover:text-foreground sm:self-auto"
                    >
                        Refresh list
                    </button>
                </div>
            </section>

            {showYearModal && (
                <ModalShell
                    saving={saving}
                    title={editingYear ? "Edit Year Level" : "Add Year Level"}
                    onClose={() => {
                        if (saving) return;
                        setShowYearModal(false);
                        setError("");
                    }}
                >
                    <form onSubmit={handleSaveYear} className="space-y-4 bg-white dark:bg-[var(--card)]">
                        <p className="text-md text-foreground/60">
                            Select the course and year level for this curriculum.
                        </p>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Course</label>
                            <div className="relative cursor-pointer">
                                <select
                                    value={yearForm.course_id}
                                    onChange={(event) =>
                                        setYearForm((previous) => ({
                                            ...previous,
                                            course_id: event.target.value,
                                        }))
                                    }
                                    required
                                    className="w-full appearance-none rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 pr-10 text-sm outline-none focus:border-[var(--secondary)]"
                                >
                                    <option value="" className="text-[#24232E]">
                                        Select course
                                    </option>

                                    {courses.map((course) => (
                                        <option
                                            key={course.id}
                                            value={course.id}
                                            className="text-[#24232E]"
                                        >
                                            {course.name}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Year Level</label>
                            <div className="relative cursor-pointer">
                                <select
                                    value={yearForm.year_number}
                                    onChange={(event) =>
                                        setYearForm((previous) => ({
                                            ...previous,
                                            year_number: event.target.value,
                                        }))
                                    }
                                    required
                                    className="w-full appearance-none rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--secondary)]"
                                >
                                    {YEAR_OPTIONS.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            className="text-[#24232E]"
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                                />
                            </div>
                        </div>

                        {error && <FormError message={error} />}

                        <ModalActions
                            saving={saving}
                            submitLabel={editingYear ? "Save Changes" : "Create Year Level"}
                            onCancel={() => {
                                setShowYearModal(false);
                                setError("");
                            }}
                        />
                    </form>
                </ModalShell>
            )}

            {showSubjectModal && (
                <ModalShell
                    saving={saving}
                    title={editingSubject ? "Edit Subject" : "Add Subject"}
                    onClose={() => {
                        if (saving) return;
                        setShowSubjectModal(false);
                        setError("");
                    }}
                >
                    <form onSubmit={handleSaveSubject} className="space-y-4">
                        <p className="text-sm text-foreground/60">
                            Assign a subject to a course year level.
                        </p>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Year Level</label>
                            <div className="relative">

                                <select
                                    value={subjectForm.year_level_id}
                                    onChange={(event) =>
                                        setSubjectForm((previous) => ({
                                            ...previous,
                                            year_level_id: event.target.value,
                                        }))
                                    }
                                    required
                                    className="w-full appearance-none rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--secondary)]"
                                >
                                    <option value="" className="text-[#24232E]">
                                        Select course and year level
                                    </option>
                                    {yearLevels
                                        .filter(
                                            (year) =>
                                                selectedCourse === "all" ||
                                                year.course_id === selectedCourse
                                        )
                                        .map((year) => {
                                            const course = courses.find(
                                                (item) => item.id === year.course_id
                                            );

                                            return (
                                                <option
                                                    key={year.id}
                                                    value={year.id}
                                                    className="text-[#24232E]"
                                                >
                                                    {course?.name} — {year.name}
                                                </option>
                                            );
                                        })}
                                </select>
                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                                />
                            </div>
                            
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Subject Name</label>
                            <input
                                value={subjectForm.name}
                                onChange={(event) =>
                                    setSubjectForm((previous) => ({
                                        ...previous,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="e.g. Programming Fundamentals"
                                required
                                maxLength={150}
                                className="w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-[var(--secondary)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Subject Code</label>
                            <input
                                value={subjectForm.code}
                                onChange={(event) =>
                                    setSubjectForm((previous) => ({
                                        ...previous,
                                        code: event.target.value
                                            .toUpperCase()
                                            .replace(/\s+/g, ""),
                                    }))
                                }
                                placeholder="e.g. CS101"
                                required
                                maxLength={30}
                                className="w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-[var(--secondary)]"
                            />
                            <p className="text-xs text-foreground/50">
                                Subject codes must be unique within a year level.
                            </p>
                        </div>

                        {error && <FormError message={error} />}

                        <ModalActions
                            saving={saving}
                            submitLabel={editingSubject ? "Save Changes" : "Add Subject"}
                            onCancel={() => {
                                setShowSubjectModal(false);
                                setError("");
                            }}
                        />
                    </form>
                </ModalShell>
            )}

            {deleteSubjectTarget && (
                <ConfirmModal
                    title="Delete Subject?"
                    message={
                        <>
                            Are you sure you want to delete{" "}
                            <strong className="text-foreground">
                                {deleteSubjectTarget.name}
                            </strong>
                            ? This action cannot be undone.
                        </>
                    }
                    busy={deleting}
                    onCancel={() => setDeleteSubjectTarget(null)}
                    onConfirm={() => void handleDeleteSubject()}
                />
            )}

            {deleteYearTarget && (
                <ConfirmModal
                    title="Delete Year Level?"
                    message={
                        <>
                            Delete{" "}
                            <strong className="text-foreground">
                                {deleteYearTarget.name}
                            </strong>
                            ? This is only allowed when the year level has no
                            subjects.
                        </>
                    }
                    busy={deleting}
                    onCancel={() => setDeleteYearTarget(null)}
                    onConfirm={() => void handleDeleteYear()}
                />
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white p-5 dark:bg-[var(--card)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <span className="text-base font-medium text-foreground/70">
                        {title}
                    </span>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
                <div className="rounded-xl bg-[#C9A0DC]/10 p-3 text-[var(--primary)]">
                    {icon}
                </div>
            </div>
            <p className="text-sm text-foreground/60">{description}</p>
        </div>
    );
}

function ModalShell({
    title,
    saving,
    onClose,
    children,
}: {
    title: string;
    saving:boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[rgba(0,0,0,0.5)] p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="my-auto w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-5 shadow-2xl dark:bg-[var(--card)] sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-foreground/50 bg-[var(--primary)] hover:bg-[#24232E] text-white transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FormError({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-500">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </div>
    );
}

function ModalActions({
    saving,
    submitLabel,
    onCancel,
}: {
    saving: boolean;
    submitLabel: string;
    onCancel: () => void;
}) {
    return (
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition 
                    hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#24232E] transition"
            >
                {saving ? "Saving..." : submitLabel}
            </button>
        </div>
    );
}

function ConfirmModal({
    title,
    message,
    busy,
    onCancel,
    onConfirm,
}: {
    title: string;
    message: React.ReactNode;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-6 shadow-2xl dark:bg-[#201D25]">

                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/60">
                    {message}
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row justify-between">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onCancel}
                        className="rounded-xl border border-foreground/15 px-4 py-2.5 text-sm transition hover:bg-foreground/5 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onConfirm}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                        <Trash2 size={15} />
                        {busy ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

