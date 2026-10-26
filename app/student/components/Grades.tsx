
"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    GraduationCap,
    Search,
    TrendingUp,
    X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
    id: string;
    admin_id: string | null;
    role: string;
};

type StudentRecord = {
    id: string;
    admin_id: string;
    user_id: string;
};

type Subject = {
    id: string;
    name: string;
    code: string | null;
};

type AcademicRequirement = {
    id: string;
    admin_id: string;
    educator_id: string;
    subject_id: string;
    name: string;
    requirement_type: string | null;
    semester: string | null;
    grading_period: string | null;
    max_score: number | null;
};

type GradeRecord = {
    id: string;
    admin_id: string;
    educator_id: string;
    student_id: string;
    subject_id: string;
    semester: string | null;
    grading_period: string | null;
    requirement_id: string | null;
    grade: number | null;
    remarks: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type GradeItem = AcademicRequirement & {
    gradeRecord: GradeRecord | null;
};

const GRADING_PERIODS = [
    "First Quarter",
    "Second Quarter",
    "Third Quarter",
    "Fourth Quarter",
];

const PASSING_PERCENTAGE = 75;
const EXCELLENT_PERCENTAGE = 90;

const formatGrade = (grade: number | null | undefined) => {
    if (
        grade === null ||
        grade === undefined ||
        !Number.isFinite(Number(grade))
    ) {
        return "—";
    }

    return Number(grade).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getGradePercentage = (
    grade: number | null | undefined,
    maxScore: number | null | undefined
): number | null => {
    if (
        grade === null ||
        grade === undefined ||
        maxScore === null ||
        maxScore === undefined ||
        !Number.isFinite(Number(grade)) ||
        !Number.isFinite(Number(maxScore)) ||
        Number(maxScore) <= 0
    ) {
        return null;
    }

    return (Number(grade) / Number(maxScore)) * 100;
};

const getGradeStyle = (
    grade: number | null | undefined,
    maxScore: number | null | undefined
) => {
    if (grade === null || grade === undefined) {
        return "bg-foreground/5 text-foreground/60";
    }

    const percentage = getGradePercentage(grade, maxScore);

    if (percentage === null) {
        return "bg-foreground/5 text-foreground/70";
    }

    if (percentage >= EXCELLENT_PERCENTAGE) {
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (percentage >= PASSING_PERCENTAGE) {
        return "bg-[var(--primary)]/20 text-foreground";
    }

    return "bg-red-500/10 text-red-600 dark:text-red-400";
};

const getGradeLabel = (
    grade: number | null | undefined,
    maxScore: number | null | undefined
) => {
    if (grade === null || grade === undefined) return "Pending";

    const percentage = getGradePercentage(grade, maxScore);

    if (percentage === null) return "Score recorded";
    if (percentage >= EXCELLENT_PERCENTAGE) return "Excellent";
    if (percentage >= PASSING_PERCENTAGE) return "Passed";

    return "Needs improvement";
};

const getGradeMessage = (
    grade: number | null | undefined,
    maxScore: number | null | undefined
) => {
    if (grade === null || grade === undefined) {
        return "Your educator has not recorded a grade for this requirement yet.";
    }

    const percentage = getGradePercentage(grade, maxScore);

    if (percentage === null) {
        return "Your score is recorded, but a valid maximum score is needed to calculate your result.";
    }

    if (percentage < PASSING_PERCENTAGE) {
        return `You scored ${formatGrade(grade)} out of ${formatGrade(maxScore)} (${formatGrade(percentage)}%). This is below the ${PASSING_PERCENTAGE}% passing mark. Review the lesson materials and ask your educator for guidance on how to improve.`;
    }

    if (percentage >= EXCELLENT_PERCENTAGE) {
        return `Excellent work! You earned ${formatGrade(percentage)}% on this requirement. Keep up the great work!`;
    }

    return `You passed this requirement with ${formatGrade(percentage)}%. Keep practicing and working toward an excellent result!`;
};

const getRecordPeriod = (item: GradeItem) =>
    item.gradeRecord?.grading_period ?? item.grading_period;

const getRecordSemester = (item: GradeItem) =>
    item.gradeRecord?.semester ?? item.semester;

const getRecordTimestamp = (record: GradeRecord | null) =>
    record?.updated_at ?? record?.created_at ?? null;

const formatScore = (
    grade: number | null | undefined,
    maxScore: number | null | undefined
) => {
    if (grade === null || grade === undefined) return "—";

    if (maxScore === null || maxScore === undefined) {
        return formatGrade(grade);
    }

    return `${formatGrade(grade)} / ${formatGrade(maxScore)}`;
};

export default function Grades() {
    const supabase = useMemo(() => createClient(), []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [requirements, setRequirements] = useState<AcademicRequirement[]>([]);
    const [grades, setGrades] = useState<GradeRecord[]>([]);

    const [selectedSubject, setSelectedSubject] = useState("all");
    const [selectedPeriod, setSelectedPeriod] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequirement, setSelectedRequirement] =
        useState<GradeItem | null>(null);

    const loadGrades = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                setError("Please sign in to view your grades.");
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("id, admin_id, role")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            const profile = profileData as StudentProfile;

            if (profile.role !== "student") {
                setError("This page is available to student accounts only.");
                return;
            }

            if (!profile.admin_id) {
                setError(
                    "Your account is not linked to an administrator yet."
                );
                return;
            }

            const { data: studentData, error: studentError } = await supabase
                .from("students")
                .select("id, admin_id, user_id")
                .eq("user_id", user.id)
                .eq("admin_id", profile.admin_id)
                .maybeSingle();

            if (studentError) throw studentError;

            if (!studentData) {
                setError(
                    "Your student record could not be found. Please contact your administrator."
                );
                return;
            }

            const student = studentData as StudentRecord;

            // Load subjects in which this student is enrolled.
            const { data: enrollmentData, error: enrollmentError } =
                await supabase
                    .from("student_subjects")
                    .select("subject_id")
                    .eq("admin_id", profile.admin_id)
                    .eq("student_id", student.id);

            if (enrollmentError) throw enrollmentError;

            const subjectIds = [
                ...new Set(
                    (enrollmentData ?? [])
                        .map((item) => item.subject_id as string | null)
                        .filter((id): id is string => Boolean(id))
                ),
            ];

            if (subjectIds.length === 0) {
                setSubjects([]);
                setRequirements([]);
                setGrades([]);
                setSelectedRequirement(null);
                return;
            }

            // Load only subjects assigned to this student.
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name, code")
                .eq("admin_id", profile.admin_id)
                .in("id", subjectIds)
                .order("name");

            if (subjectError) throw subjectError;

            const enrolledSubjects = (subjectData ?? []) as Subject[];
            setSubjects(enrolledSubjects);

            const enrolledSubjectIds = enrolledSubjects.map(
                (subject) => subject.id
            );

            if (enrolledSubjectIds.length === 0) {
                setRequirements([]);
                setGrades([]);
                setSelectedRequirement(null);
                return;
            }

            // Load academic requirements for enrolled subjects.
            const { data: requirementData, error: requirementError } =
                await supabase
                    .from("academic_requirements")
                    .select(
                        "id, admin_id, educator_id, subject_id, name, requirement_type, semester, grading_period, max_score"
                    )
                    .eq("admin_id", profile.admin_id)
                    .in("subject_id", enrolledSubjectIds)
                    .order("name");

            if (requirementError) throw requirementError;

            setRequirements(
                (requirementData ?? []) as AcademicRequirement[]
            );

            // Load saved grades for this student.
            const { data: gradeData, error: gradeError } = await supabase
                .from("grades")
                .select(
                    "id, admin_id, educator_id, student_id, subject_id, semester, grading_period, requirement_id, grade, remarks, created_at, updated_at"
                )
                .eq("admin_id", profile.admin_id)
                .eq("student_id", student.id)
                .in("subject_id", enrolledSubjectIds)
                .order("updated_at", { ascending: true });

            if (gradeError) throw gradeError;

            setGrades((gradeData ?? []) as GradeRecord[]);
            setSelectedRequirement(null);
        } catch (err) {
            console.error("Error loading student grades:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading your grades."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void loadGrades();
    }, [loadGrades]);

    // Match each requirement to its saved grade record.
    const gradeItems = useMemo<GradeItem[]>(() => {
        const gradeMap = new Map<string, GradeRecord>();

        for (const grade of grades) {
            if (!grade.requirement_id) continue;

            const key = `${grade.subject_id}:${grade.requirement_id}`;
            gradeMap.set(key, grade);
        }

        return requirements.map((requirement) => ({
            ...requirement,
            gradeRecord:
                gradeMap.get(
                    `${requirement.subject_id}:${requirement.id}`
                ) ?? null,
        }));
    }, [requirements, grades]);

    const availablePeriods = useMemo(() => {
        const periods = new Set<string>();

        for (const item of gradeItems) {
            const period = getRecordPeriod(item);
            if (period) periods.add(period);
        }

        const knownPeriods = GRADING_PERIODS.filter((period) =>
            periods.has(period)
        );

        const otherPeriods = [...periods]
            .filter((period) => !GRADING_PERIODS.includes(period))
            .sort((a, b) => a.localeCompare(b));

        return [...knownPeriods, ...otherPeriods];
    }, [gradeItems]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return gradeItems.filter((item) => {
            const subject = subjects.find(
                (entry) => entry.id === item.subject_id
            );

            const matchesSubject =
                selectedSubject === "all" ||
                item.subject_id === selectedSubject;

            const period = getRecordPeriod(item);

            const matchesPeriod =
                selectedPeriod === "all" || period === selectedPeriod;

            const matchesSearch =
                !query ||
                item.name.toLowerCase().includes(query) ||
                (item.requirement_type ?? "").toLowerCase().includes(query) ||
                (subject?.name ?? "").toLowerCase().includes(query) ||
                (subject?.code ?? "").toLowerCase().includes(query);

            return matchesSubject && matchesPeriod && matchesSearch;
        });
    }, [
        gradeItems,
        subjects,
        selectedSubject,
        selectedPeriod,
        searchQuery,
    ]);

    const summary = useMemo(() => {
        const gradedItems = filteredItems.filter(
            (item) =>
                item.gradeRecord?.grade !== null &&
                item.gradeRecord?.grade !== undefined
        );

        return {
            total: filteredItems.length,
            graded: gradedItems.length,
            pending: filteredItems.length - gradedItems.length,
        };
    }, [filteredItems]);

    const clearFilters = () => {
        setSelectedSubject("all");
        setSelectedPeriod("all");
        setSearchQuery("");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-full p-4 sm:p-6">
                <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center sm:p-8">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <h2 className="text-lg font-semibold">
                        Unable to load grades
                    </h2>
                    <p className="text-sm text-foreground/65">{error}</p>
                    <button
                        type="button"
                        onClick={() => void loadGrades()}
                        className="mt-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-foreground transition hover:opacity-80"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full min-w-0 space-y-6 overflow-y-auto p-4 hide-scrollbar sm:p-6">
            {/* Page heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/15">
                        <GraduationCap className="h-6 w-6 text-[var(--secondary)]" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight">
                            My Grades
                        </h1>
                        <p className="mt-1 text-sm text-foreground/60">
                            Track your academic performance and grades for
                            your enrolled subjects.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void loadGrades()}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-foreground/20 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 dark:bg-[var(--card)] sm:self-auto"
                >
                    <TrendingUp className="h-4 w-4" />
                    Refresh grades
                </button>
            </div>

            {/* Summary cards: no average grade */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                    icon={<BookOpen className="h-5 w-5" />}
                    label="Enrolled Subjects"
                    value={subjects.length.toString()}
                    description="Subjects in your schedule"
                />

                <SummaryCard
                    icon={<ClipboardList className="h-5 w-5" />}
                    label="Requirements"
                    value={summary.total.toString()}
                    description="Matching your current filters"
                />

                <SummaryCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Graded"
                    value={summary.graded.toString()}
                    description={`${summary.pending} awaiting grades`}
                />
            </div>

            {/* Academic requirements */}
            <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-sm dark:bg-[var(--card)]">
                <div className="border-b border-foreground/10 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Academic Requirements
                            </h2>
                            <p className="mt-1 text-sm text-foreground/60">
                                View your grades for quizzes, activities,
                                projects, and other requirements.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="self-start rounded-xl border border-foreground/20 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 dark:bg-[var(--card)]"
                        >
                            Clear filters
                        </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="relative min-w-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search requirements..."
                                aria-label="Search academic requirements"
                                className="w-full rounded-xl border border-foreground/20 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-foreground/40 focus:border-[var(--primary)] dark:bg-[var(--card)]"
                            />
                        </div>

                        <div className="relative min-w-0">
                            <select
                                value={selectedSubject}
                                onChange={(event) =>
                                    setSelectedSubject(event.target.value)
                                }
                                aria-label="Filter by subject"
                                className="w-full appearance-none rounded-xl border border-foreground/20 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[var(--primary)] dark:bg-[var(--card)]"
                            >
                                <option value="all">All subjects</option>
                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                        </div>

                        <div className="relative min-w-0">
                            <select
                                value={selectedPeriod}
                                onChange={(event) =>
                                    setSelectedPeriod(event.target.value)
                                }
                                aria-label="Filter by grading period"
                                className="w-full appearance-none rounded-xl border border-foreground/20 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[var(--primary)] dark:bg-[var(--card)]"
                            >
                                <option value="all">All grading periods</option>
                                {availablePeriods.map((period) => (
                                    <option key={period} value={period}>
                                        {period}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                        </div>
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/15">
                            <ClipboardList className="h-7 w-7 text-[var(--secondary)]" />
                        </div>

                        <h3 className="mt-4 font-semibold">
                            No academic requirements found
                        </h3>

                        <p className="mt-2 max-w-md text-sm text-foreground/60">
                            {requirements.length === 0
                                ? "Your enrolled subjects do not have any academic requirements yet."
                                : "Try changing your search or filters to see more requirements."}
                        </p>

                        {(selectedSubject !== "all" ||
                            selectedPeriod !== "all" ||
                            searchQuery) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[850px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-foreground/10 bg-foreground/[0.025]">
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Requirement
                                        </th>
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Subject
                                        </th>
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Grading Period
                                        </th>
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Score
                                        </th>
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Result
                                        </th>
                                        <th className="px-5 py-4 text-sm font-semibold">
                                            Last Updated
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredItems.map((item) => {
                                        const subject = subjects.find(
                                            (entry) =>
                                                entry.id === item.subject_id
                                        );
                                        const grade = item.gradeRecord?.grade;

                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() =>
                                                    setSelectedRequirement(item)
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.key === "Enter" ||
                                                        event.key === " "
                                                    ) {
                                                        event.preventDefault();
                                                        setSelectedRequirement(item);
                                                    }
                                                }}
                                                tabIndex={0}
                                                className="cursor-pointer border-b border-foreground/10 transition last:border-b-0 hover:bg-foreground/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="font-medium">
                                                        {item.name}
                                                    </div>
                                                    <div className="mt-1 text-sm text-foreground/55">
                                                        {item.requirement_type ||
                                                            "Academic requirement"}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-medium">
                                                        {subject?.name ?? "—"}
                                                    </div>
                                                    <div className="mt-1 text-sm text-foreground/55">
                                                        {subject?.code || ""}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-foreground/70">
                                                    {getRecordPeriod(item) || "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-semibold ${getGradeStyle(
                                                            grade,
                                                            item.max_score
                                                        )}`}
                                                    >
                                                        {formatScore(
                                                            grade,
                                                            item.max_score
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div
                                                        className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-medium ${getGradeStyle(
                                                            grade,
                                                            item.max_score
                                                        )}`}
                                                    >
                                                        {getGradeLabel(
                                                            grade,
                                                            item.max_score
                                                        )}
                                                    </div>
                                                    {grade !== null &&
                                                        grade !== undefined &&
                                                        getGradePercentage(
                                                            grade,
                                                            item.max_score
                                                        ) !== null && (
                                                            <p className="mt-1 text-sm text-foreground/55">
                                                                {formatGrade(
                                                                    getGradePercentage(
                                                                        grade,
                                                                        item.max_score
                                                                    )
                                                                )}
                                                                %
                                                            </p>
                                                        )}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-foreground/60">
                                                    {formatDate(
                                                        getRecordTimestamp(
                                                            item.gradeRecord
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="space-y-3 p-4 md:hidden">
                            {filteredItems.map((item) => {
                                const subject = subjects.find(
                                    (entry) =>
                                        entry.id === item.subject_id
                                );
                                const grade = item.gradeRecord?.grade;
                                const percentage = getGradePercentage(
                                    grade,
                                    item.max_score
                                );

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedRequirement(item)
                                        }
                                        className="w-full rounded-xl border border-foreground/10 p-4 text-left transition hover:bg-foreground/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="break-words font-semibold">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-foreground/60">
                                                    {subject?.name ??
                                                        "Unknown subject"}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold ${getGradeStyle(
                                                    grade,
                                                    item.max_score
                                                )}`}
                                            >
                                                {formatScore(
                                                    grade,
                                                    item.max_score
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <span className="rounded-lg bg-foreground/5 px-2.5 py-1 text-sm text-foreground/70">
                                                {item.requirement_type ||
                                                    "Requirement"}
                                            </span>

                                            <span className="rounded-lg bg-foreground/5 px-2.5 py-1 text-sm text-foreground/70">
                                                {getRecordPeriod(item) ||
                                                    "No period"}
                                            </span>

                                            <span
                                                className={`rounded-lg px-2.5 py-1 text-sm font-medium ${getGradeStyle(
                                                    grade,
                                                    item.max_score
                                                )}`}
                                            >
                                                {getGradeLabel(
                                                    grade,
                                                    item.max_score
                                                )}
                                            </span>
                                        </div>

                                        {percentage !== null && (
                                            <p className="mt-3 text-sm text-foreground/60">
                                                Score percentage:{" "}
                                                {formatGrade(percentage)}%
                                            </p>
                                        )}

                                        <p className="mt-3 text-sm text-foreground/55">
                                            Tap to view grade details
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="border-t border-foreground/10 px-5 py-4">
                    <p className="text-sm text-foreground/55">
                        Showing {filteredItems.length} of {gradeItems.length}{" "}
                        academic requirements
                    </p>
                </div>
            </section>

            {/* Requirement details modal */}
            {selectedRequirement && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedRequirement(null);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setSelectedRequirement(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="grade-detail-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-foreground/10 bg-white shadow-xl dark:bg-[var(--card)]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-5">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15">
                                    <ClipboardList className="h-5 w-5 text-[var(--secondary)]" />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="grade-detail-title"
                                        className="break-words text-lg font-semibold"
                                    >
                                        {selectedRequirement.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-foreground/60">
                                        {subjects.find(
                                            (subject) =>
                                                subject.id ===
                                                selectedRequirement.subject_id
                                        )?.name ?? "Academic requirement"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Close grade details"
                                onClick={() => setSelectedRequirement(null)}
                                className="bg-[var(--primary)]/80 transition cursor-pointer text-white items-center gap-3 rounded-lg p-2 hover:bg-[#24232E] disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="rounded-2xl bg-[var(--primary)]/10 p-5 text-center">
                                <p className="text-sm text-foreground/60">
                                    Your score
                                </p>

                                <p className="mt-2 break-words text-3xl font-bold">
                                    {formatScore(
                                        selectedRequirement.gradeRecord?.grade,
                                        selectedRequirement.max_score
                                    )}
                                </p>

                                {getGradePercentage(
                                    selectedRequirement.gradeRecord?.grade,
                                    selectedRequirement.max_score
                                ) !== null && (
                                    <p className="mt-2 text-sm text-foreground/60">
                                        {formatGrade(
                                            getGradePercentage(
                                                selectedRequirement.gradeRecord?.grade,
                                                selectedRequirement.max_score
                                            )
                                        )}
                                        % of the maximum score
                                    </p>
                                )}

                                <span
                                    className={`mt-3 inline-flex rounded-lg px-3 py-1 text-sm font-medium ${getGradeStyle(
                                        selectedRequirement.gradeRecord?.grade,
                                        selectedRequirement.max_score
                                    )}`}
                                >
                                    {getGradeLabel(
                                        selectedRequirement.gradeRecord?.grade,
                                        selectedRequirement.max_score
                                    )}
                                </span>

                                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-foreground/70">
                                    {getGradeMessage(
                                        selectedRequirement.gradeRecord?.grade,
                                        selectedRequirement.max_score
                                    )}
                                </p>
                            </div>

                            <DetailRow
                                label="Requirement type"
                                value={
                                    selectedRequirement.requirement_type ||
                                    "Not specified"
                                }
                            />

                            <DetailRow
                                label="Grading period"
                                value={
                                    getRecordPeriod(selectedRequirement) ||
                                    "Not specified"
                                }
                            />

                            <DetailRow
                                label="Semester"
                                value={
                                    getRecordSemester(selectedRequirement) ||
                                    "Not specified"
                                }
                            />

                            <DetailRow
                                label="Maximum score"
                                value={
                                    selectedRequirement.max_score === null
                                        ? "Not specified"
                                        : formatGrade(
                                              selectedRequirement.max_score
                                          )
                                }
                            />

                            <DetailRow
                                label="Last updated"
                                value={formatDate(
                                    getRecordTimestamp(
                                        selectedRequirement.gradeRecord
                                    )
                                )}
                            />

                            <div className="rounded-xl border border-foreground/10 p-4">
                                <p className="text-sm font-medium">
                                    Educator's remarks
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/65">
                                    {selectedRequirement.gradeRecord?.remarks?.trim() ||
                                        "No remarks have been added for this requirement."}
                                </p>
                            </div>
                            
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    description,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="min-w-0 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm dark:bg-[var(--card)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-foreground/60">{label}</p>
                    <p className="mt-2 break-words text-2xl font-bold">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--secondary)]">
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-sm text-foreground/55">{description}</p>
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-foreground/10 pb-3 last:border-b-0">
            <span className="text-sm text-foreground/60">{label}</span>
            <span className="break-words text-right text-sm font-medium">
                {value}
            </span>
        </div>
    );
}
