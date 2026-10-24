
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WanderingEyes } from "@/components/ui/WanderingEyes";
import {
    CalendarDays,
    Check,
    CheckCheck,
    ChevronDown,
    Download,
    LoaderCircle,
    Search,
    Save,
    Users,
    X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

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

type AttendanceRecord = {
    id?: string;
    student_id: string;
    subject_id: string;
    attendance_date: string;
    status: AttendanceStatus;
    remarks: string;
};

type Profile = {
    id: string;
    role: string;
    admin_id: string | null;
};

const STATUS_OPTIONS: {
    value: AttendanceStatus;
    label: string;
    color: string;
}[] = [
    {
        value: "present",
        label: "Present",
        color: "bg-emerald-500/10 text-emerald-600",
    },
    {
        value: "absent",
        label: "Absent",
        color: "bg-red-500/10 text-red-500",
    },
    {
        value: "late",
        label: "Late",
        color: "bg-amber-500/10 text-amber-600",
    },
    {
        value: "excused",
        label: "Excused",
        color: "bg-violet-500/10 text-violet-600",
    },
];

function getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000)
        .toISOString()
        .slice(0, 10);
}

function getStatusLabel(status?: AttendanceStatus) {
    return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Unmarked";
}

function getStatusColor(status?: AttendanceStatus) {
    return (
        STATUS_OPTIONS.find((option) => option.value === status)?.color ??
        "bg-foreground/5 text-foreground/60"
    );
}

export default function Attendance() {
    const supabase = useMemo(() => createClient(), []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [educatorId, setEducatorId] = useState("");
    const [adminId, setAdminId] = useState("");

    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [attendance, setAttendance] = useState<
        Record<string, AttendanceRecord>
    >({});

    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadAttendance = useCallback(async () => {
        if (!adminId || !selectedSubject || !selectedDate) {
            setAttendance({});
            return;
        }

        const { data, error: fetchError } = await supabase
            .from("attendance")
            .select(
                "id, student_id, subject_id, attendance_date, status, remarks"
            )
            .eq("admin_id", adminId)
            .eq("subject_id", selectedSubject)
            .eq("attendance_date", selectedDate);

        if (fetchError) {
            console.error("Failed to load attendance:", fetchError);
            setError(fetchError.message);
            return;
        }

        const records: Record<string, AttendanceRecord> = {};

        for (const record of data ?? []) {
            records[record.student_id] = {
                id: record.id,
                student_id: record.student_id,
                subject_id: record.subject_id,
                attendance_date: record.attendance_date,
                status: record.status as AttendanceStatus,
                remarks: record.remarks ?? "",
            };
        }

        setAttendance(records);
    }, [adminId, selectedSubject, selectedDate, supabase]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");
        setNotice("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                throw new Error("Please sign in to access attendance.");
            }

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("id, role, admin_id")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            const profile = profileData as Profile;

            if (profile.role !== "educator") {
                throw new Error("Only educator accounts can manage attendance.");
            }

            if (!profile.admin_id) {
                throw new Error(
                    "Your educator account is not linked to an administrator."
                );
            }

            setEducatorId(user.id);
            setAdminId(profile.admin_id);

            const [
                { data: studentData, error: studentError },
                { data: subjectData, error: subjectError },
            ] = await Promise.all([
                supabase
                    .from("students")
                    .select(
                        "id, student_number, first_name, last_name, email, department, academic_program, year_level"
                    )
                    .eq("admin_id", profile.admin_id)
                    .order("last_name", { ascending: true }),

                supabase
                    .from("subjects")
                    .select("id, name, code")
                    .eq("admin_id", profile.admin_id)
                    .order("name", { ascending: true }),
            ]);

            if (studentError) throw studentError;
            if (subjectError) throw subjectError;

            setStudents((studentData ?? []) as Student[]);
            setSubjects((subjectData ?? []) as Subject[]);
        } catch (err) {
            console.error("Failed to load attendance page:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load attendance."
            );
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (loading || !adminId || !selectedSubject || !selectedDate) {
            return;
        }

        void loadAttendance();
    }, [
        loading,
        adminId,
        selectedSubject,
        selectedDate,
        loadAttendance,
    ]);

    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return students.filter((student) => {
            const matchesSearch =
                !query ||
                [
                    student.student_number,
                    student.first_name,
                    student.last_name,
                    student.email ?? "",
                    student.academic_program ?? "",
                ].some((value) => value.toLowerCase().includes(query));

            const studentStatus = attendance[student.id]?.status;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "unmarked"
                    ? !studentStatus
                    : studentStatus === statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [students, attendance, searchQuery, statusFilter]);

    const counts = useMemo(() => {
        const result = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            unmarked: 0,
        };

        for (const student of students) {
            const status = attendance[student.id]?.status;

            if (status && status in result) {
                result[status as AttendanceStatus]++;
            } else {
                result.unmarked++;
            }
        }

        return result;
    }, [students, attendance]);

    const updateStatus = (
        studentId: string,
        status: AttendanceStatus
    ) => {
        setAttendance((previous) => ({
            ...previous,
            [studentId]: {
                ...previous[studentId],
                student_id: studentId,
                subject_id: selectedSubject,
                attendance_date: selectedDate,
                status,
                remarks: previous[studentId]?.remarks ?? "",
            },
        }));

        setError("");
        setNotice("");
    };

    const updateRemarks = (studentId: string, remarks: string) => {
        setAttendance((previous) => ({
            ...previous,
            [studentId]: {
                ...previous[studentId],
                student_id: studentId,
                subject_id: selectedSubject,
                attendance_date: selectedDate,
                status: previous[studentId]?.status as AttendanceStatus,
                remarks,
            },
        }));

        setNotice("");
    };

    const markAllPresent = () => {
        if (!selectedSubject) {
            setError("Please select a subject first.");
            return;
        }

        setAttendance((previous) => {
            const next = { ...previous };

            for (const student of students) {
                next[student.id] = {
                    ...next[student.id],
                    student_id: student.id,
                    subject_id: selectedSubject,
                    attendance_date: selectedDate,
                    status: "present",
                    remarks: next[student.id]?.remarks ?? "",
                };
            }

            return next;
        });

        setError("");
        setNotice("");
    };

    const saveAttendance = async () => {
        if (!educatorId || !adminId) {
            setError("Your educator profile could not be verified.");
            return;
        }

        if (!selectedSubject) {
            setError("Please select a subject first.");
            return;
        }

        if (!selectedDate) {
            setError("Please select an attendance date.");
            return;
        }

        if (students.length === 0) {
            setError("There are no students to record attendance for.");
            return;
        }

        const unmarkedStudents = students.filter(
            (student) => !attendance[student.id]?.status
        );

        if (unmarkedStudents.length > 0) {
            setError(
                `Please mark all students before saving. ${unmarkedStudents.length} student${unmarkedStudents.length === 1 ? "" : "s"} still unmarked.`
            );
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const records = students.map((student) => {
                const record = attendance[student.id];

                if (
                    !record ||
                    !STATUS_OPTIONS.some(
                        (option) => option.value === record.status
                    )
                ) {
                    throw new Error(
                        `Please select an attendance status for ${student.first_name} ${student.last_name}.`
                    );
                }

                return {
                    admin_id: adminId,
                    educator_id: educatorId,
                    student_id: student.id,
                    subject_id: selectedSubject,
                    attendance_date: selectedDate,
                    status: record.status,
                    remarks: record.remarks?.trim() || null,
                };
            });

            const { error: saveError } = await supabase
                .from("attendance")
                .upsert(records, {
                    onConflict: "student_id,subject_id,attendance_date",
                });

            if (saveError) {
                console.error("Supabase attendance save error:", saveError);
                throw new Error(saveError.message);
            }

            await loadAttendance();
            setNotice("Attendance saved successfully.");
        } catch (err) {
            console.error("Failed to save attendance:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save attendance."
            );
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        if (students.length === 0) {
            setError("There are no students to export.");
            return;
        }

        const selectedSubjectData = subjects.find(
            (subject) => subject.id === selectedSubject
        );

        const escapeCSV = (value: string | null | undefined) =>
            `"${(value ?? "").replace(/"/g, '""')}"`;

        const rows = [
            [
                "Student Number",
                "First Name",
                "Last Name",
                "Email",
                "Department",
                "Academic Program",
                "Year Level",
                "Subject",
                "Date",
                "Status",
                "Remarks",
            ],
            ...students.map((student) => {
                const record = attendance[student.id];

                return [
                    student.student_number,
                    student.first_name,
                    student.last_name,
                    student.email ?? "",
                    student.department ?? "",
                    student.academic_program ?? "",
                    student.year_level ?? "",
                    selectedSubjectData?.name ?? "",
                    selectedDate,
                    record?.status ?? "unmarked",
                    record?.remarks ?? "",
                ];
            }),
        ];

        const csv = rows
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `attendance-${selectedDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
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
            {/* Header */}
            <div className="sm:mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Attendance
                    </h1>
                    <p className="mt-3 text-sm text-foreground/60">
                        Record and manage your students&apos; attendance.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={exportCSV}
                        disabled={students.length === 0}
                        className="cursor-pointer bg-white dark:bg-[var(--card)] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={17} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={saveAttendance}
                        disabled={saving || students.length === 0}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={17} />
                        )}
                        {saving ? "Saving..." : "Save Attendance"}
                    </button>
                </div>
            </div>

            {/* Notices */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-foreground/20 bg-red-500/5 p-4 text-sm text-red-500">
                    <X size={18} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{error}</p>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="rounded-lg border border-foreground/20 p-1"
                        aria-label="Dismiss error"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {notice && (
                <div className="flex items-center gap-3 rounded-xl border border-foreground/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
                    <Check size={18} />
                    <p>{notice}</p>
                </div>
            )}

            {/* Filters */}
            <section className="rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarDays size={19} className="text-primary" />
                    <h2 className="font-semibold">Attendance Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="attendance-subject"
                            className="text-sm font-medium text-foreground/70"
                        >
                            Subject
                        </label>

                        <div className="relative">
                            <select
                                id="attendance-subject"
                                value={selectedSubject}
                                onChange={(event) => {
                                    setSelectedSubject(event.target.value);
                                    setError("");
                                    setNotice("");
                                }}
                                className="cursor-pointer w-full bg-white dark:bg-[var(--card)] appearance-none rounded-xl border border-foreground/20 px-4 py-3 pr-10 text-sm outline-none transition "
                            >
                                <option value="">Select a subject</option>
                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.code
                                            ? `${subject.code} — ${subject.name}`
                                            : subject.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={17}
                                className="cursor-pointer pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                        </div>

                        {subjects.length === 0 && (
                            <p className="text-xs text-foreground/50">
                                No subjects are available for your institution.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="attendance-date"
                            className="text-sm font-medium text-foreground/70"
                        >
                            Attendance Date
                        </label>

                        <input
                            id="attendance-date"
                            type="date"
                            value={selectedDate}
                            onChange={(event) => {
                                setSelectedDate(event.target.value);
                                setError("");
                                setNotice("");
                            }}
                            className="cursor-pointer w-full bg-white dark:bg-[var(--card)] rounded-xl border border-foreground/20 bg-background px-4 py-3 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)]"
                        />
                    </div>
                </div>
            </section>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <SummaryCard
                    label="Total Students"
                    value={students.length}
                    icon={<Users size={18} />}
                />
                <SummaryCard
                    label="Present"
                    value={counts.present}
                    color="text-emerald-600"
                />
                <SummaryCard
                    label="Absent"
                    value={counts.absent}
                    color="text-red-500"
                />
                <SummaryCard
                    label="Late"
                    value={counts.late}
                    color="text-amber-600"
                />
                <SummaryCard
                    label="Unmarked"
                    value={counts.unmarked}
                    color="text-foreground/60"
                />
            </div>

            {/* Student List */}
            <section className="overflow-hidden rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)] overflow-y-auto hide-scrollbar">
                <div className="flex flex-col gap-4 border-b border-foreground/20 p-4 sm:p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">Student List</h2>
                            <p className="mt-1 text-sm text-foreground/60">
                                {selectedSubject
                                    ? "Choose an attendance status for each student."
                                    : "Select a subject to begin recording attendance."}
                            </p>
                        </div>

                        <span className="w-fit rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60">
                            {filteredStudents.length} of {students.length} students
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                            />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search name, student number, or email..."
                                className="w-full rounded-xl border border-foreground/20 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div className="relative md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="cursor-pointer bg-white dark:bg-[var(--card)] w-full appearance-none rounded-xl border border-foreground/20 px-3 py-2.5 pr-9 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)]"
                            >
                                <option value="all">All statuses</option>
                                <option value="unmarked">Unmarked</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                            </select>
                            <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={markAllPresent}
                            disabled={!selectedSubject || students.length === 0}
                            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCheck size={17} />
                            Mark All Present
                        </button>
                    </div>
                </div>

                {!selectedSubject ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/20 bg-primary/10 text-primary">
                            <CalendarDays size={25} />
                        </div>
                        <h3 className="font-semibold">Select a subject</h3>
                        <p className="mt-1 max-w-sm text-sm text-foreground/60">
                            Choose a subject above to load and manage its
                            attendance.
                        </p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                        <Users
                            size={30}
                            className="mx-auto mb-3 text-foreground/40"
                        />
                        <h3 className="font-semibold">No students found</h3>
                        <p className="mt-1 text-sm text-foreground/60">
                            There are no students associated with your
                            institution.
                        </p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                        <Search
                            size={28}
                            className="mx-auto mb-3 text-foreground/40"
                        />
                        <h3 className="font-semibold">No matching students</h3>
                        <p className="mt-1 text-sm text-foreground/60">
                            Try changing your search or status filter.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[950px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-foreground/20 bg-foreground/[0.025]">
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                            Student
                                        </th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                            Program / Year
                                        </th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.map((student) => {
                                        const record = attendance[student.id];

                                        return (
                                            <tr
                                                key={student.id}
                                                className="border-b border-foreground/20 last:border-b-0 transition hover:bg-foreground/[0.02]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/20 bg-primary/10 text-sm font-semibold text-primary">
                                                            {student.first_name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                            {student.last_name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium">
                                                                {student.first_name}{" "}
                                                                {student.last_name}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-foreground/50">
                                                                {student.student_number}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-sm">
                                                        {student.academic_program ||
                                                            "—"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-foreground/50">
                                                        {student.year_level ||
                                                            "Year not set"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="relative w-36">
                                                        <select
                                                            value={
                                                                record?.status ??
                                                                ""
                                                            }
                                                            onChange={(event) =>
                                                                updateStatus(
                                                                    student.id,
                                                                    event.target
                                                                        .value as AttendanceStatus
                                                                )
                                                            }
                                                            className={`w-full appearance-none cursor-pointer bg-white dark:bg-[var(--card)] rounded-lg border border-foreground/20 px-3 py-2 pr-8 text-sm font-medium outline-none transition focus:ring-1 focus:ring-[var(--primary)] ${
                                                                record?.status
                                                                    ? getStatusColor(
                                                                          record.status
                                                                      )
                                                                    : "bg-background text-foreground/50"
                                                            }`}
                                                            aria-label={`Attendance status for ${student.first_name} ${student.last_name}`}
                                                        >
                                                            <option value="" disabled>
                                                                Select status
                                                            </option>
                                                            {STATUS_OPTIONS.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                        <ChevronDown
                                                            size={15}
                                                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                                                        />
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <input
                                                        type="text"
                                                        value={
                                                            record?.remarks ??
                                                            ""
                                                        }
                                                        onChange={(event) =>
                                                            updateRemarks(
                                                                student.id,
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Add remarks..."
                                                        className="w-full min-w-36 cursor-pointer bg-white dark:bg-[var(--card)] rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none transition focus:ring-1 focus:ring-[var(--primary)]"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="flex flex-col gap-3 p-3 md:hidden">
                            {filteredStudents.map((student) => {
                                const record = attendance[student.id];

                                return (
                                    <article
                                        key={student.id}
                                        className="flex flex-col gap-4 rounded-xl border border-foreground/20 p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-foreground/20 bg-primary/10 text-sm font-semibold text-primary">
                                                {student.first_name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                                {student.last_name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-md">
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </h3>
                                                <p className="mt-1 text-sm text-foreground/50">
                                                    {student.student_number}
                                                </p>
                                                <p className="mt-1 break-words text-xs text-foreground/60">
                                                    {student.academic_program ||
                                                        "Program not set"}
                                                    {student.year_level
                                                        ? ` · ${student.year_level}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-lg border border-foreground/20 px-2 py-1 text-xs font-medium ${getStatusColor(
                                                    record?.status
                                                )}`}
                                            >
                                                {getStatusLabel(record?.status)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label
                                                htmlFor={`status-${student.id}`}
                                                className="text-xs font-medium text-foreground/60"
                                            >
                                                Attendance Status
                                            </label>

                                            <div className="relative">
                                                <select
                                                    id={`status-${student.id}`}
                                                    value={record?.status ?? ""}
                                                    onChange={(event) =>
                                                        updateStatus(
                                                            student.id,
                                                            event.target
                                                                .value as AttendanceStatus
                                                        )
                                                    }
                                                    className="w-full cursor-pointer bg-white dark:bg-[var(--card)] appearance-none rounded-xl border border-foreground/20 bg-background px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    <option value="" disabled>
                                                        Select status
                                                    </option>
                                                    {STATUS_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label
                                                htmlFor={`remarks-${student.id}`}
                                                className="text-xs font-medium text-foreground/60"
                                            >
                                                Remarks
                                            </label>
                                            <input
                                                id={`remarks-${student.id}`}
                                                type="text"
                                                value={record?.remarks ?? ""}
                                                onChange={(event) =>
                                                    updateRemarks(
                                                        student.id,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Add remarks..."
                                                className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-foreground/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm text-foreground/50">
                        {counts.unmarked === 0 && students.length > 0
                            ? "All students have an attendance status."
                            : `${counts.unmarked} student${counts.unmarked === 1 ? "" : "s"} still unmarked.`}
                    </p>

                    <button
                        type="button"
                        onClick={saveAttendance}
                        disabled={
                            saving ||
                            !selectedSubject ||
                            students.length === 0
                        }
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={17} />
                        )}
                        {saving ? "Saving..." : "Save Attendance"}
                    </button>
                </div>
            </section>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    color = "text-foreground",
}: {
    label: string;
    value: number;
    icon?: React.ReactNode;
    color?: string;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-foreground/20 bg-white dark:bg-[var(--card)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-md font-medium text-foreground/60">
                    {label}
                </p>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>
                {value}
            </p>
        </div>
    );
}
