import type { AppRole } from "./access";

export interface AuthUser {
  id?: string;
  _id?: string;
  schoolId?: string;
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";
  email?: string;
  admissionNumber?: string;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
  mustChangePassword?: boolean;
  profile?: { name?: string };
}

export interface PublicSchool {
  _id: string;
  name: string;
  city: string;
  state: string;
  code: string;
}

export interface PublicClassSection {
  _id: string;
  grade: number;
  section: string;
  stream?: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({})) as T & { message?: string; errors?: Array<{ msg?: string }> };
  if (!response.ok) {
    throw new Error(result.message ?? result.errors?.[0]?.msg ?? "Unable to complete the request.");
  }
  return result;
}

export function appRoleFromUser(user: AuthUser): AppRole | null {
  if (user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN") return "admin";
  if (user.role === "TEACHER") return "teacher";
  if (user.role === "STUDENT") return "student";
  return null;
}

export async function login(input: { identifier: string; password: string; role: AppRole; schoolId?: string }): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function registerSchool(input: {
  name: string;
  code: string;
  academicYear: string;
  email: string;
  password: string;
  profile: { name: string };
}): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/auth/register-school", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function registerSchoolAccount(input: {
  role: "TEACHER" | "STUDENT";
  email?: string;
  password: string;
  admissionNumber?: string;
  profile: { name: string };
}): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/auth/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await request<{ user: AuthUser }>("/auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof Error && /authentication|required|expired|invalid token/i.test(error.message)) return null;
    throw error;
  }
}

export async function searchSchools(query: string): Promise<PublicSchool[]> {
  const result = await request<{ schools: PublicSchool[] }>(`/auth/public/schools?q=${encodeURIComponent(query)}`);
  return result.schools;
}

export async function getPublicClasses(schoolId: string): Promise<PublicClassSection[]> {
  const result = await request<{ classes: PublicClassSection[] }>(`/auth/public/schools/${encodeURIComponent(schoolId)}/classes`);
  return result.classes;
}

export async function registerForRole(kind: "school" | "teacher" | "student", input: Record<string, unknown>): Promise<{ user?: AuthUser; message: string }> {
  const path = kind === "school" ? "/auth/register-school" : kind === "teacher" ? "/auth/register-teacher" : "/auth/register-student";
  return request(path, { method: "POST", body: JSON.stringify(input) });
}

export async function verifyOtp(email: string, code: string): Promise<{ user: AuthUser; schoolCode?: string }> {
  return request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, code }) });
}

export async function logout(): Promise<void> {
  await request<{ success: boolean }>("/auth/logout", { method: "POST" });
}


export interface PublicTimetableEntry { day: string; periodNumber: number; subject?: string; teacher?: string }
export interface PublicTimetable { class: { grade: number; section: string }; entries: PublicTimetableEntry[] }

export async function getPublicTimetable(schoolId: string, grade: number, section: string): Promise<PublicTimetable> {
  return request<PublicTimetable>(`/timetable/public?schoolId=${encodeURIComponent(schoolId)}&grade=${grade}&section=${encodeURIComponent(section)}`);
}
