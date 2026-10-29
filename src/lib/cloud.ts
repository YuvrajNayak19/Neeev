import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  CATEGORIES,
  type Assignment,
  type Category,
  type Teacher,
  type TimetablePeriod,
} from "@/lib/substitution";
import type { SavedSchedule } from "@/lib/history";

const toCategory = (v: string): Category =>
  (CATEGORIES as readonly string[]).includes(v) ? (v as Category) : "TGT";

function localIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type Profile = {
  fullName: string;
  schoolName: string;
  schoolId: string;
  studentPasscode: string;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, school_name, school_id, student_passcode")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    fullName: data.full_name,
    schoolName: data.school_name,
    schoolId: data.school_id,
    studentPasscode: data.student_passcode,
  };
}

export async function upsertProfile(userId: string, profile: Profile) {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: profile.fullName,
      school_name: profile.schoolName,
      school_id: profile.schoolId.trim().toUpperCase(),
      student_passcode: profile.studentPasscode.trim(),
    });
  if (error) {
    console.error("Profile save error:", error);
    if (error.code === "23505" && error.message.includes("profiles_school_id_unique")) {
      throw new Error("This School ID is already in use. Please choose a different School ID.");
    }
    throw error;
  }
}

export async function verifyStudentAccess(schoolId: string, studentPasscode: string) {
  const { error } = await supabase.functions.invoke("student-substitutions", {
    body: {
      schoolId: schoolId.trim().toUpperCase(),
      passcode: studentPasscode.trim(),
      date: localIsoDate(),
    },
  });
  if (error) throw error;
  return true;
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, name, subject, category, busy, timetable, weekly_timetable")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    category: toCategory(r.category),
    busy: (r.busy ?? {}) as Record<number, boolean>,
    timetable: (r.timetable ?? {}) as Record<number, TimetablePeriod>,
    weeklyTimetable: (r.weekly_timetable ?? {}) as Record<number, Record<number, TimetablePeriod>>,
  }));
}

/** Replaces the stored teacher schedule with `teachers` for the signed-in user. */
export async function syncTeachers(userId: string, teachers: Teacher[]) {
  const ids = teachers.map((t) => t.id);
  if (teachers.length > 0) {
    const { error } = await supabase.from("teachers").upsert(
      teachers.map((t) => ({
        id: t.id,
        user_id: userId,
        name: t.name,
        subject: t.subject,
        category: t.category,
        busy: t.busy,
        timetable: t.timetable ?? {},
        weekly_timetable: t.weeklyTimetable ?? {},
      })),
    );
    if (error) throw error;
  }
  let del = supabase.from("teachers").delete().eq("user_id", userId);
  if (ids.length > 0) del = del.not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
  const { error: delError } = await del;
  if (delError) throw delError;
}

export async function fetchSavedDays(): Promise<SavedSchedule[]> {
  const { data, error } = await supabase
    .from("saved_schedules")
    .select("day, rows, updated_at")
    .order("day", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    date: r.day,
    savedAt: r.updated_at,
    rows: (r.rows ?? []) as unknown as Assignment[],
  }));
}

export async function saveDay(userId: string, date: string, rows: Assignment[]) {
  const { error } = await supabase
    .from("saved_schedules")
    .upsert(
      { user_id: userId, day: date, rows: rows as unknown as never },
      { onConflict: "user_id,day" },
    );
  if (error) throw error;
}

export async function deleteDay(userId: string, date: string) {
  const { error } = await supabase
    .from("saved_schedules")
    .delete()
    .eq("user_id", userId)
    .eq("day", date);
  if (error) throw error;
}

export type SubstitutionRecord = {
  schoolId: string;
  date: string;
  period: number;
  className: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string | null;
  substituteTeacherName: string;
  status: "assigned" | "overridden";
};

export async function saveSubstitutions(
  userId: string,
  schoolId: string,
  date: string,
  rows: Assignment[],
) {
  const normalizedSchoolId = schoolId.trim().toUpperCase();
  const { error: deleteError } = await supabase
    .from("substitutions")
    .delete()
    .eq("created_by", userId)
    .eq("school_id", normalizedSchoolId)
    .eq("date", date);
  if (deleteError) throw deleteError;

  const records = rows.map((row) => ({
    school_id: normalizedSchoolId,
    date,
    period: row.period,
    class_name: row.classSection,
    original_teacher_id: row.absentTeacherId,
    original_teacher_name: row.absentTeacherName,
    substitute_teacher_id: row.substituteId,
    substitute_teacher_name: row.substituteName,
    status: row.reason === "Manually overridden" ? "overridden" : "assigned",
    created_by: userId,
  }));
  if (records.length === 0) return;

  const { error } = await supabase.from("substitutions").upsert(records, {
    onConflict: "school_id,date,period,class_name,original_teacher_id",
  });
  if (error) throw error;
}

export async function fetchStudentSubstitutions(
  schoolId: string,
  passcode: string,
  date: string,
): Promise<SubstitutionRecord[]> {
  const { data, error } = await supabase.functions.invoke("student-substitutions", {
    body: {
      schoolId: schoolId.trim().toUpperCase(),
      passcode,
      date,
    },
  });
  if (error) throw error;
  return ((data?.substitutions ?? []) as Array<{
    school_id: string;
    date: string;
    period: number;
    class_name: string;
    original_teacher_id: string;
    original_teacher_name: string;
    substitute_teacher_id: string | null;
    substitute_teacher_name: string;
    status: string;
  }>).map((row) => ({
    schoolId: row.school_id,
    date: row.date,
    period: row.period,
    className: row.class_name,
    originalTeacherId: row.original_teacher_id,
    originalTeacherName: row.original_teacher_name,
    substituteTeacherId: row.substitute_teacher_id,
    substituteTeacherName: row.substitute_teacher_name,
    status: row.status === "overridden" ? "overridden" : "assigned",
  }));
}
