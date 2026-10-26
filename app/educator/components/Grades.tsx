"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    FilePlus2,
    LoaderCircle,
    Pencil,
    RefreshCw,
    Search,
    Save,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SEMESTERS = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
] as const;

const GRADING_PERIODS = [
    "First Quarter",
    "Second Quarter",
    "Third Quarter",
    "Fourth Quarter",
] as const;

const REQUIREMENT_TYPES = [
    "Pretest",
    "Posttest",
    "Exam",
    "Activity",
    "Assignment",
    "Project",
    "Seminar",
    "Other",
] as const;

type Semester = (typeof SEMESTERS)[number];
type GradingPeriod = (typeof GRADING_PERIODS)[number];

type Student = {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string | null;
    department: string | null;
    academic_program: string | null;
    year_level: string | null;
};

type Subject = {
    id: string;
    name: string;
    code: string | null;
};

type Requirement = {
    id: string;
    name: string;
    requirement_type: string;
    subject_id: string;
    semester: Semester;
    grading_period: GradingPeriod;
    max_score: number;
    created_at: string;
};

type GradeEntry = {
    grade: string;
    remarks: string;
};

type GradeRow = {
    student_id: string;
    grade: number | string | null;
    remarks: string | null;
};

type Profile = {
    role: string;
    admin_id: string | null;
};

type RequirementForm = {
    name: string;
    requirement_type: string;
    subject_id: string;
    semester: Semester;
    grading_period: GradingPeriod;
    max_score: string;
};

const EMPTY_FORM: RequirementForm = {
    name: "",
    requirement_type: "Exam",
    subject_id: "",
    semester: "1st Semester",
    grading_period: "First Quarter",
    max_score: "100",
};

const inputClass =
    "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--secondary)]";

const selectClass =
    "w-full appearance-none rounded-xl border border-foreground/20 bg-transparent py-2.5 pl-3 pr-9 text-sm text-foreground outline-none transition focus:border-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50";

const buttonPrimaryClass =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

function FilterSelect({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder: string;
    disabled?: boolean;
}) {
    return (
        <div className="relative min-w-0 ">
            <select
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className={selectClass}
            >
                <option value="" className="text-[#24232E]">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="text-[#24232E]">
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
        </div>
    );
}

export default function Grades() {
    const supabase = useMemo(() => createClient(), []);

    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [gradeEntries, setGradeEntries] = useState<
        Record<string, GradeEntry>
    >({});

    const [adminId, setAdminId] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedSemester, setSelectedSemester] =
        useState<Semester>("1st Semester");

    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);

    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [programFilter, setProgramFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");

    const [form, setForm] = useState<RequirementForm>(EMPTY_FORM);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [editingRequirement, setEditingRequirement] =
        useState<Requirement | null>(null);

    const [requirementToDelete, setRequirementToDelete] =
        useState<Requirement | null>(null);

    const [loading, setLoading] = useState(true);
    const [requirementsLoading, setRequirementsLoading] = useState(false);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load the authenticated educator, students, and subjects.
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;
            if (!user) throw new Error("Please sign in to continue.");

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role, admin_id")
                .eq("id", user.id)
                .single<Profile>();

            if (profileError) throw profileError;

            if (profile.role !== "educator") {
                throw new Error("Only educators can manage grades.");
            }

            if (!profile.admin_id) {
                throw new Error(
                    "Your educator account is not linked to an institution."
                );
            }

            setAdminId(profile.admin_id);

            const [
                { data: studentData, error: studentError },
                { data: assignmentData, error: assignmentError },
            ] = await Promise.all([
                supabase
                    .from("students")
                    .select(
                        "id, student_number, first_name, last_name, email, department, academic_program, year_level"
                    )
                    .eq("admin_id", profile.admin_id)
                    .order("last_name", { ascending: true }),

                // educator_id references profiles.id, so use user.id.
                supabase
                    .from("subject_assignments")
                    .select("subject_id")
                    .eq("admin_id", profile.admin_id)
                    .eq("educator_id", user.id),
            ]);

            if (studentError) throw studentError;
            if (assignmentError) throw assignmentError;

            const loadedStudents = (studentData ?? []) as Student[];

            const subjectIds = [
                ...new Set(
                    (assignmentData ?? []).map(
                        (assignment) => assignment.subject_id
                    )
                ),
            ];

            let loadedSubjects: Subject[] = [];

            if (subjectIds.length > 0) {
                const { data: subjectData, error: subjectError } = await supabase
                    .from("subjects")
                    .select("id, name, code")
                    .eq("admin_id", profile.admin_id)
                    .in("id", subjectIds)
                    .order("name", { ascending: true });

                if (subjectError) throw subjectError;

                loadedSubjects = (subjectData ?? []) as Subject[];
            }

            setStudents(loadedStudents);
            setSubjects(loadedSubjects);

            setSelectedSubject((current) =>
                loadedSubjects.some((subject) => subject.id === current)
                    ? current
                    : loadedSubjects[0]?.id ?? ""
            );

            setForm((current) => ({
                ...current,
                subject_id: loadedSubjects.some(
                    (subject) => subject.id === current.subject_id
                )
                    ? current.subject_id
                    : loadedSubjects[0]?.id ?? "",
            }));

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load grade data."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Load requirements for the selected subject and semester.
    const loadRequirements = useCallback(async () => {
        if (!adminId || !selectedSubject) {
            setRequirements([]);
            setSelectedRequirement(null);
            setGradeEntries({});
            return;
        }

        setRequirementsLoading(true);

        try {
            const { data, error: queryError } = await supabase
                .from("academic_requirements")
                .select(
                    "id, name, requirement_type, subject_id, semester, grading_period, max_score, created_at"
                )
                .eq("admin_id", adminId)
                .eq("subject_id", selectedSubject)
                .eq("semester", selectedSemester)
                .order("created_at", { ascending: false });

            if (queryError) throw queryError;

            const loaded = (data ?? []) as Requirement[];

            setRequirements(loaded);

            setSelectedRequirement((current) => {
                if (!current) return null;

                return loaded.find((item) => item.id === current.id) ?? null;
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load academic requirements."
            );
        } finally {
            setRequirementsLoading(false);
        }
    }, [adminId, selectedSubject, selectedSemester, supabase]);

    // Load grades saved for the selected requirement.
    const loadRequirementGrades = useCallback(
        async (requirement: Requirement) => {
            setGradesLoading(true);
            setError("");
            setGradeEntries({});

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;
                if (!user) {
                    throw new Error(
                        "Your session has expired. Please sign in again."
                    );
                }

                const { data, error: queryError } = await supabase
                    .from("grades")
                    .select("student_id, grade, remarks")
                    .eq("admin_id", adminId)
                    .eq("educator_id", user.id)
                    .eq("requirement_id", requirement.id);

                if (queryError) throw queryError;

                const entries: Record<string, GradeEntry> = {};

                ((data ?? []) as GradeRow[]).forEach((row) => {
                    entries[row.student_id] = {
                        grade:
                            row.grade === null || row.grade === undefined
                                ? ""
                                : String(row.grade),
                        remarks: row.remarks ?? "",
                    };
                });

                setGradeEntries(entries);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load student grades."
                );
            } finally {
                setGradesLoading(false);
            }
        },
        [adminId, supabase]
    );

    useEffect(() => {
        void loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        void loadRequirements();
    }, [loadRequirements]);

    const selectedSubjectDetails = subjects.find(
        (subject) => subject.id === selectedSubject
    );

    const departmentOptions = useMemo(
        () =>
            [
                ...new Set(
                    students
                        .map((student) => student.department)
                        .filter((value): value is string => Boolean(value))
                ),
            ]
                .sort()
                .map((value) => ({ label: value, value })),
        [students]
    );

    const programOptions = useMemo(
        () =>
            [
                ...new Set(
                    students
                        .map((student) => student.academic_program)
                        .filter((value): value is string => Boolean(value))
                ),
            ]
                .sort()
                .map((value) => ({ label: value, value })),
        [students]
    );

    const yearOptions = useMemo(
        () =>
            [
                ...new Set(
                    students
                        .map((student) => student.year_level)
                        .filter((value): value is string => Boolean(value))
                ),
            ]
                .sort()
                .map((value) => ({ label: value, value })),
        [students]
    );

    const gradeIsValid = useCallback((raw: string, maxScore: number) => {
        if (!raw.trim()) return false;

        const value = Number(raw);

        return (
            Number.isFinite(value) &&
            value >= 0 &&
            value <= maxScore &&
            value <= 100
        );
    }, []);

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();

        return students.filter((student) => {
            const fullName =
                `${student.first_name} ${student.last_name}`.toLowerCase();

            const matchesSearch =
                !query ||
                fullName.includes(query) ||
                (student.student_number ?? "").toLowerCase().includes(query) ||
                (student.email ?? "").toLowerCase().includes(query);

            const entry = gradeEntries[student.id];

            const valid = selectedRequirement
                ? gradeIsValid(
                      entry?.grade ?? "",
                      Math.min(Number(selectedRequirement.max_score), 100)
                  )
                : false;

            return (
                matchesSearch &&
                (!departmentFilter ||
                    student.department === departmentFilter) &&
                (!programFilter ||
                    student.academic_program === programFilter) &&
                (!yearFilter || student.year_level === yearFilter) &&
                (!gradeFilter ||
                    (gradeFilter === "graded" ? valid : !valid))
            );
        });
    }, [
        students,
        search,
        departmentFilter,
        programFilter,
        yearFilter,
        gradeFilter,
        gradeEntries,
        selectedRequirement,
        gradeIsValid,
    ]);

    const updateGradeEntry = (
        studentId: string,
        field: keyof GradeEntry,
        value: string
    ) => {
        setGradeEntries((current) => ({
            ...current,
            [studentId]: {
                grade: current[studentId]?.grade ?? "",
                remarks: current[studentId]?.remarks ?? "",
                [field]: value,
            },
        }));
    };

    const gradedCount = selectedRequirement
        ? students.filter((student) =>
              gradeIsValid(
                  gradeEntries[student.id]?.grade ?? "",
                  Math.min(Number(selectedRequirement.max_score), 100)
              )
          ).length
        : 0;

    const pendingCount = students.length - gradedCount;

    const clearFilters = () => {
        setSearch("");
        setDepartmentFilter("");
        setProgramFilter("");
        setYearFilter("");
        setGradeFilter("");
    };

    const hasActiveFilters = Boolean(
        search ||
            departmentFilter ||
            programFilter ||
            yearFilter ||
            gradeFilter
    );

    const openCreateModal = () => {
        setEditingRequirement(null);
        setForm({
            ...EMPTY_FORM,
            subject_id: selectedSubject,
            semester: selectedSemester,
        });
        setError("");
        setSuccess("");
        setShowCreateModal(true);
    };

    const openEditModal = (requirement: Requirement) => {
        setEditingRequirement(requirement);

        setForm({
            name: requirement.name,
            requirement_type: requirement.requirement_type,
            subject_id: requirement.subject_id,
            semester: requirement.semester,
            grading_period: requirement.grading_period,
            max_score: String(requirement.max_score),
        });

        setError("");
        setSuccess("");
        setShowCreateModal(true);
    };

    // Create or update an academic requirement.
    const handleSaveRequirement = async () => {
        setError("");
        setSuccess("");

        const name = form.name.trim();
        const maxScore = Number(form.max_score);

        if (!name) {
            setError("Enter a requirement name.");
            return;
        }

        if (!form.subject_id) {
            setError("Select a subject.");
            return;
        }

        if (
            !Number.isFinite(maxScore) ||
            maxScore <= 0 ||
            maxScore > 100
        ) {
            setError(
                "Maximum score must be greater than zero and no more than 100."
            );
            return;
        }

        setSaving(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                throw new Error(
                    "Your session has expired. Please sign in again."
                );
            }

            const payload = {
                name,
                requirement_type: form.requirement_type,
                subject_id: form.subject_id,
                semester: form.semester,
                grading_period: form.grading_period,
                max_score: maxScore,
                updated_at: new Date().toISOString(),
            };

            if (editingRequirement) {
                const { data, error: updateError } = await supabase
                    .from("academic_requirements")
                    .update(payload)
                    .eq("id", editingRequirement.id)
                    .eq("admin_id", adminId)
                    .eq("educator_id", user.id)
                    .select("id")
                    .maybeSingle();

                if (updateError) throw updateError;

                if (!data) {
                    throw new Error(
                        "The requirement was not updated. Check your permissions and RLS policies."
                    );
                }

                setSuccess("Academic requirement updated successfully.");
            } else {
                const { error: insertError } = await supabase
                    .from("academic_requirements")
                    .insert({
                        ...payload,
                        admin_id: adminId,
                        educator_id: user.id,
                    });

                if (insertError) throw insertError;

                setSuccess("Academic requirement created successfully.");
            }

            setShowCreateModal(false);
            setEditingRequirement(null);

            await loadRequirements();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save the academic requirement."
            );
        } finally {
            setSaving(false);
        }
    };

    // Save grades using the existing grade column.
    
const handleSaveGrades = async () => {
    if (!selectedRequirement) {
        setError("Please select an academic requirement.");
        return;
    }

    setError("");
    setSuccess("");

    const maxScore = Math.min(
        Number(selectedRequirement.max_score),
        100
    );

    const studentsWithGrades = students.filter(
        (student) =>
            (gradeEntries[student.id]?.grade ?? "").trim() !== ""
    );

    const invalidStudent = studentsWithGrades.find((student) => {
        const raw = gradeEntries[student.id]?.grade ?? "";
        return !gradeIsValid(raw, maxScore);
    });

    if (invalidStudent) {
        setError(
            `Enter a valid grade between 0 and ${maxScore} for ${invalidStudent.first_name} ${invalidStudent.last_name}.`
        );
        return;
    }

    if (studentsWithGrades.length === 0) {
        setError("Enter at least one grade before saving.");
        return;
    }

    setSaving(true);

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
            throw new Error(
                "Your session has expired. Please sign in again."
            );
        }

        if (!adminId) {
            throw new Error(
                "Administrator could not be identified. Refresh the page and try again."
            );
        }

        // Confirm the requirement belongs to this educator and institution.
        const { data: requirement, error: requirementError } =
            await supabase
                .from("academic_requirements")
                .select("id, subject_id, semester, grading_period")
                .eq("id", selectedRequirement.id)
                .eq("admin_id", adminId)
                .eq("educator_id", user.id)
                .maybeSingle();

        if (requirementError) throw requirementError;

        if (!requirement) {
            throw new Error(
                "This requirement could not be verified for your educator account. Refresh the page and select it again."
            );
        }

        const records = studentsWithGrades.map((student) => ({
            admin_id: adminId,
            educator_id: user.id,
            student_id: student.id,
            subject_id: requirement.subject_id,
            semester: requirement.semester,
            grading_period: requirement.grading_period,
            requirement_id: requirement.id,
            grade: Number(gradeEntries[student.id].grade),
            remarks:
                gradeEntries[student.id].remarks.trim() || null,
            updated_at: new Date().toISOString(),
        }));

        // Find existing grades for this requirement.
        const { data: existingGrades, error: existingError } =
            await supabase
                .from("grades")
                .select("id, student_id")
                .eq("admin_id", adminId)
                .eq("educator_id", user.id)
                .eq("requirement_id", requirement.id);

        if (existingError) throw existingError;

        const existingByStudent = new Map<
            string,
            { id: string; student_id: string }[]
        >();

        for (const existing of existingGrades ?? []) {
            const studentRecords =
                existingByStudent.get(existing.student_id) ?? [];

            studentRecords.push({
                id: existing.id,
                student_id: existing.student_id,
            });

            existingByStudent.set(
                existing.student_id,
                studentRecords
            );
        }

        const recordsToInsert: typeof records = [];
        let updatedCount = 0;

        // Update existing rows by primary key; queue missing rows for insert.
        for (const record of records) {
            const matches =
                existingByStudent.get(record.student_id) ?? [];

            if (matches.length === 0) {
                recordsToInsert.push(record);
                continue;
            }

            // Update all matching rows if old duplicate records exist.
            for (const existing of matches) {
                const { error: updateError } = await supabase
                    .from("grades")
                    .update({
                        grade: record.grade,
                        remarks: record.remarks,
                        subject_id: record.subject_id,
                        semester: record.semester,
                        grading_period: record.grading_period,
                        updated_at: record.updated_at,
                    })
                    .eq("id", existing.id)
                    .eq("admin_id", adminId)
                    .eq("educator_id", user.id)
                    .eq("requirement_id", requirement.id);

                if (updateError) throw updateError;
            }

            updatedCount++;
        }

        // Insert only grades that do not already have a row.
        if (recordsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from("grades")
                .insert(recordsToInsert);

            if (insertError) throw insertError;
        }

        setSuccess(
            `Grades saved successfully for ${records.length} student${
                records.length === 1 ? "" : "s"
            } (${updatedCount} updated, ${recordsToInsert.length} inserted).`
        );

        await loadRequirementGrades(selectedRequirement);
    } catch (err: unknown) {
        console.error("Save student grades failed:", err);

        const message =
            typeof err === "object" &&
            err !== null &&
            "message" in err &&
            typeof err.message === "string"
                ? err.message
                : "An unexpected error occurred while saving grades.";

        setError(`Unable to save student grades: ${message}`);
    } finally {
        setSaving(false);
    }
};


    const handleDeleteRequirement = async () => {
        if (!requirementToDelete) return;

        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                throw new Error("Your session has expired.");
            }

            const { data, error: deleteError } = await supabase
                .from("academic_requirements")
                .delete()
                .eq("id", requirementToDelete.id)
                .eq("admin_id", adminId)
                .eq("educator_id", user.id)
                .select("id")
                .maybeSingle();

            if (deleteError) throw deleteError;

            if (!data) {
                throw new Error(
                    "The requirement was not deleted. Check your permissions and RLS policies."
                );
            }

            if (selectedRequirement?.id === requirementToDelete.id) {
                setSelectedRequirement(null);
                setGradeEntries({});
            }

            setRequirementToDelete(null);
            setSuccess("Academic requirement deleted.");

            await loadRequirements();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete the requirement."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <WanderingEyes className="text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-4 sm:p-6">
            <div className="sm:mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Grades
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Create academic requirements and manage student grades.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void loadInitialData()}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:shadow-md dark:bg-[var(--card)]"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        disabled={subjects.length === 0}
                        className={buttonPrimaryClass}
                    >
                        <FilePlus2 size={17} />
                        Create Requirement
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{error}</p>
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
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{success}</p>
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss success"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Subject and semester filters */}
            <section className="rounded-2xl border border-foreground/20 bg-white p-5 shadow-sm dark:bg-[var(--card)]">
                <div className="mb-4 flex items-center gap-2">
                    <BookOpen
                        size={19}
                        className="text-[var(--secondary)]"
                    />
                    <h2 className="font-semibold text-foreground">
                        Grade Settings
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Subject
                        </label>
                        <FilterSelect
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            placeholder="Select subject"
                            options={subjects.map((subject) => ({
                                label: subject.code
                                    ? `${subject.code} — ${subject.name}`
                                    : subject.name,
                                value: subject.id,
                            }))}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Semester
                        </label>
                        <FilterSelect
                            value={selectedSemester}
                            onChange={(value) =>
                                setSelectedSemester(value as Semester)
                            }
                            placeholder="Select semester"
                            options={SEMESTERS.map((semester) => ({
                                label: semester,
                                value: semester,
                            }))}
                        />
                    </div>
                </div>

                {selectedSubjectDetails && (
                    <div className="mt-4 rounded-xl border border-foreground/20 p-3">
                        <p className="text-sm font-medium">
                            {selectedSubjectDetails.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {selectedSubjectDetails.code || "No subject code"} ·{" "}
                            {selectedSemester}
                        </p>
                    </div>
                )}
            </section>

            {/* Requirements list */}
            <section className="overflow-hidden rounded-2xl border border-foreground/20 bg-white shadow-sm dark:bg-[var(--card)]">
                <div className="flex flex-col gap-3 border-b border-foreground/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold">
                            Academic Requirements
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select a requirement to manage its student grades.
                        </p>
                    </div>

                    <span className="w-fit rounded-full border border-foreground/20 px-3 py-1 text-xs text-muted-foreground">
                        {requirements.length}{" "}
                        {requirements.length === 1
                            ? "requirement"
                            : "requirements"}
                    </span>
                </div>

                {requirementsLoading ? (
                    <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
                        <LoaderCircle size={18} className="animate-spin" />
                        Loading requirements...
                    </div>
                ) : !selectedSubject ? (
                    <div className="p-12 text-center">
                        <BookOpen
                            size={34}
                            className="mx-auto text-muted-foreground"
                        />
                        <p className="mt-3 font-medium">
                            No subject selected
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select a subject to view its requirements.
                        </p>
                    </div>
                ) : requirements.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--secondary)]">
                            <ClipboardList size={26} />
                        </div>
                        <h3 className="mt-4 font-semibold">
                            No academic requirements yet
                        </h3>
                        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                            Create a pretest, posttest, exam, seminar, project,
                            or other requirement for this subject.
                        </p>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className={`${buttonPrimaryClass} mt-4`}
                        >
                            <FilePlus2 size={16} />
                            Create Requirement
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-foreground/20 bg-background text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-4 font-medium">Requirement</th>
                                        <th className="px-5 py-4 font-medium">Type</th>
                                        <th className="px-5 py-4 font-medium">Maximum Score</th>
                                        <th className="px-5 py-4 font-medium">Semester / Quarter</th>
                                        <th className="px-5 py-4 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/20">
                                    {requirements.map((requirement) => (
                                        <tr key={requirement.id} className="transition hover:bg-foreground/[0.03]">
                                            <td className="px-5 py-4">
                                                <p className="font-medium">{requirement.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {selectedSubjectDetails?.code || selectedSubjectDetails?.name}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-lg border border-foreground/20 px-2.5 py-1 text-xs">
                                                    {requirement.requirement_type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">{requirement.max_score}</td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {requirement.semester}
                                                <p className="mt-1 text-xs">{requirement.grading_period}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRequirement(requirement);
                                                            clearFilters();
                                                            void loadRequirementGrades(requirement);
                                                        }}
                                                        className={`${buttonPrimaryClass} rounded-lg px-3 py-2`}
                                                    >
                                                        <Pencil size={14} />
                                                        Manage Grades
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(requirement)}
                                                        aria-label={`Edit ${requirement.name}`}
                                                        className="cursor-pointer rounded-lg border border-foreground/20 p-2"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRequirementToDelete(requirement)}
                                                        aria-label={`Delete ${requirement.name}`}
                                                        className="cursor-pointer rounded-lg border border-foreground/20 p-2"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 p-4 md:hidden">
                            {requirements.map((requirement) => (
                                <div key={requirement.id} className="rounded-xl border border-foreground/20 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-medium">{requirement.name}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{requirement.requirement_type}</p>
                                        </div>
                                        <span className="shrink-0 rounded-lg border border-foreground/20 px-2 py-1 text-xs">
                                            / {requirement.max_score}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {requirement.semester} · {requirement.grading_period}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedRequirement(requirement);
                                                clearFilters();
                                                void loadRequirementGrades(requirement);
                                            }}
                                            className={`${buttonPrimaryClass} flex-1 rounded-lg px-3 py-2.5 text-xs`}
                                        >
                                            <Pencil size={14} />
                                            Manage Grades
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(requirement)}
                                            aria-label={`Edit ${requirement.name}`}
                                            className="cursor-pointer rounded-lg border border-foreground/20 p-2.5"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRequirementToDelete(requirement)}
                                            aria-label={`Delete ${requirement.name}`}
                                            className="cursor-pointer rounded-lg border border-foreground/20 p-2.5"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* Student grades modal */}
            {selectedRequirement && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) {
                            setSelectedRequirement(null);
                        }
                    }}
                >
                    <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-foreground/20 bg-white shadow-xl dark:bg-[var(--card)]">
                        <div className="flex items-start justify-between gap-4 border-b border-foreground/20 p-5">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold">{selectedRequirement.name}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedSubjectDetails?.name} · {selectedRequirement.semester} · {selectedRequirement.grading_period} · Maximum score: {selectedRequirement.max_score}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRequirement(null)}
                                disabled={saving}
                                className="ml-auto rounded-lg bg-[var(--primary)]/80 p-2 text-white transition hover:bg-[#24232E] disabled:opacity-50"
                                aria-label="Close grades modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 border-b border-foreground/20 p-4 sm:grid-cols-3">
                            {[
                                ["Total Students", students.length],
                                ["Graded", gradedCount],
                                ["Pending", pendingCount],
                            ].map(([label, value]) => (
                                <div key={String(label)} className="rounded-xl border border-foreground/20 p-3">
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="mt-1 text-xl font-semibold">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-3 border-b border-foreground/20 p-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="relative sm:col-span-2 lg:col-span-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search students..."
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                            <FilterSelect value={departmentFilter} onChange={setDepartmentFilter} placeholder="All departments" options={departmentOptions} />
                            <FilterSelect value={programFilter} onChange={setProgramFilter} placeholder="All programs" options={programOptions} />
                            <FilterSelect value={yearFilter} onChange={setYearFilter} placeholder="All year levels" options={yearOptions} />
                            <FilterSelect
                                value={gradeFilter}
                                onChange={setGradeFilter}
                                placeholder="All statuses"
                                options={[
                                    { label: "Graded", value: "graded" },
                                    { label: "Pending", value: "pending" },
                                ]}
                            />
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-left text-xs text-muted-foreground underline sm:col-span-2 lg:col-span-5"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-auto">
                            {gradesLoading ? (
                                <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
                                    <LoaderCircle size={18} className="animate-spin" />
                                    Loading student grades...
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Users size={30} className="mx-auto text-muted-foreground" />
                                    <p className="mt-3 font-medium">No students found</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="hidden md:block">
                                        <table className="w-full text-left text-sm">
                                            <thead className="sticky top-0 z-10 border-b border-foreground/20 bg-background text-xs uppercase text-muted-foreground">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">Student</th>
                                                    <th className="px-5 py-3 font-medium">Student Number</th>
                                                    <th className="px-5 py-3 font-medium">Grade</th>
                                                    <th className="px-5 py-3 font-medium">Remarks</th>
                                                    <th className="px-5 py-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-foreground/20">
                                                {filteredStudents.map((student) => {
                                                    const entry = gradeEntries[student.id];
                                                    const raw = entry?.grade ?? "";
                                                    const valid = gradeIsValid(raw, Math.min(Number(selectedRequirement.max_score), 100));

                                                    return (
                                                        <tr key={student.id}>
                                                            <td className="px-5 py-3">
                                                                <p className="font-medium">{student.first_name} {student.last_name}</p>
                                                                <p className="mt-0.5 text-xs text-muted-foreground">{student.email || "No email"}</p>
                                                            </td>
                                                            <td className="px-5 py-3 text-muted-foreground">{student.student_number}</td>
                                                            <td className="w-36 px-5 py-3">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={Math.min(Number(selectedRequirement.max_score), 100)}
                                                                    step="any"
                                                                    value={raw}
                                                                    onChange={(event) => updateGradeEntry(student.id, "grade", event.target.value)}
                                                                    placeholder={`0–${Math.min(Number(selectedRequirement.max_score), 100)}`}
                                                                    className={inputClass}
                                                                />
                                                            </td>
                                                            <td className="min-w-52 px-5 py-3">
                                                                <input
                                                                    value={entry?.remarks ?? ""}
                                                                    onChange={(event) => updateGradeEntry(student.id, "remarks", event.target.value)}
                                                                    placeholder="Optional remarks"
                                                                    className={inputClass}
                                                                />
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`rounded-full border border-foreground/20 px-2.5 py-1 text-xs ${valid ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`}>
                                                                    {valid ? "Graded" : "Pending"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="grid gap-3 p-4 md:hidden">
                                        {filteredStudents.map((student) => {
                                            const entry = gradeEntries[student.id];
                                            const raw = entry?.grade ?? "";
                                            const maxScore = Math.min(Number(selectedRequirement.max_score), 100);
                                            const valid = gradeIsValid(raw, maxScore);

                                            return (
                                                <div key={student.id} className="rounded-xl border border-foreground/20 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">{student.student_number}</p>
                                                        </div>
                                                        <span className="rounded-full border border-foreground/20 px-2 py-1 text-xs">
                                                            {valid ? "Graded" : "Pending"}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-medium">Grade (out of {maxScore})</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={maxScore}
                                                                step="any"
                                                                value={raw}
                                                                onChange={(event) => updateGradeEntry(student.id, "grade", event.target.value)}
                                                                placeholder="Enter grade"
                                                                className={inputClass}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-medium">Remarks</label>
                                                            <input
                                                                value={entry?.remarks ?? ""}
                                                                onChange={(event) => updateGradeEntry(student.id, "remarks", event.target.value)}
                                                                placeholder="Optional remarks"
                                                                className={inputClass}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-foreground/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredStudents.length} of {students.length} students. Empty grades remain pending.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequirement(null)}
                                    disabled={saving}
                                    className="flex-1 rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5 sm:flex-none"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSaveGrades()}
                                    disabled={saving || gradesLoading}
                                    className={`${buttonPrimaryClass} flex-1 sm:flex-none`}
                                >
                                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Grades
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Create / edit requirement modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) {
                            setShowCreateModal(false);
                        }
                    }}
                >
                    <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-foreground/20 bg-white shadow-xl dark:bg-[var(--card)]">
                        <div className="flex items-start justify-between border-b border-foreground/20 p-5">
                            <div>
                                <h2 className="font-semibold">
                                    {editingRequirement ? "Edit Requirement" : "Create Academic Requirement"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Configure the requirement for a subject.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                disabled={saving}
                                className="rounded-lg bg-[var(--primary)] p-2 text-foreground transition hover:bg-[#24232E] hover:text-white disabled:opacity-50"
                                aria-label="Close requirement form"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="grid gap-4 p-5">
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Requirement Name</label>
                                <input
                                    value={form.name}
                                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="e.g. Pretest, Final Exam, Seminar"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Requirement Type</label>
                                <FilterSelect
                                    value={form.requirement_type}
                                    onChange={(value) => setForm((current) => ({ ...current, requirement_type: value }))}
                                    placeholder="Select type"
                                    options={REQUIREMENT_TYPES.map((type) => ({ label: type, value: type }))}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Subject</label>
                                <FilterSelect
                                    value={form.subject_id}
                                    onChange={(value) => setForm((current) => ({ ...current, subject_id: value }))}
                                    placeholder="Select subject"
                                    options={subjects.map((subject) => ({
                                        label: subject.code ? `${subject.code} — ${subject.name}` : subject.name,
                                        value: subject.id,
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Semester</label>
                                    <FilterSelect
                                        value={form.semester}
                                        onChange={(value) => setForm((current) => ({ ...current, semester: value as Semester }))}
                                        placeholder="Select semester"
                                        options={SEMESTERS.map((semester) => ({ label: semester, value: semester }))}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Grading Period</label>
                                    <FilterSelect
                                        value={form.grading_period}
                                        onChange={(value) => setForm((current) => ({ ...current, grading_period: value as GradingPeriod }))}
                                        placeholder="Select grading period"
                                        options={GRADING_PERIODS.map((period) => ({ label: period, value: period }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Maximum Score (up to 100)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    step="any"
                                    value={form.max_score}
                                    onChange={(event) => setForm((current) => ({ ...current, max_score: event.target.value }))}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-foreground/20 p-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                disabled={saving}
                                className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveRequirement()}
                                disabled={saving}
                                className={buttonPrimaryClass}
                            >
                                {saving && <LoaderCircle size={16} className="animate-spin" />}
                                {editingRequirement ? "Save Changes" : "Create Requirement"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {/* Delete confirmation modal */}
            {requirementToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <section className="w-full max-w-md rounded-2xl border border-foreground/20 bg-white p-5 shadow-xl dark:bg-[var(--card)]">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold">Delete Requirement?</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Delete <span className="font-medium text-foreground">{requirementToDelete.name}</span>? This cannot be undone. Linked grades will be deleted only if the database foreign key is configured for cascading deletion.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRequirementToDelete(null)}
                                disabled={saving}
                                className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDeleteRequirement()}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {saving && <LoaderCircle size={16} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
