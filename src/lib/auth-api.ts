import { getOfflineRole } from "@/demo/mode";
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
  profile?: { name?: string; phone?: string };
}

export interface Me {
  user: AuthUser;
  school: { _id: string; name: string; city: string; state?: string; board?: string; academicYear?: string; code?: string } | null;
  teacher: { _id: string; name: string; qualificationCategory: string } | null;
  student: { _id: string; name: string; admissionNumber: string; classSectionId: { _id: string; grade: number; section: string; stream?: string | null } | null } | null;
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

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** Turns technical validation messages into something a teacher can act on. */
function humanize(message: string, status: number): string {
  if (status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  if (/invalid credentials/i.test(message)) return "That email, phone or password doesn't match our records.";
  if (/^validation/i.test(message) || /expected|invalid_type|too_small/i.test(message)) return "Some details look incomplete. Please check the highlighted fields.";
  return message;
}

/**
 * Where the API lives. Empty in development (Vite proxies /api to the local server). In production
 * set VITE_API_URL to the deployed API origin, e.g. https://classsync-api.onrender.com
 */
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "");

const UNREACHABLE = "We can't reach ClassSync right now. Check your internet connection and try again.";

const loadOfflineDemo = () => import("@/demo/offline");
const isPublicRead = (path: string, options: RequestInit) => (options.method ?? "GET").toUpperCase() === "GET" && /^\/(auth\/public|timetable\/public)(\/|\?|$)/.test(path);

/**
 * Calls the API. While someone is exploring the in-browser sample school (no API reachable), the
 * call is answered by src/demo/offline.ts instead; public pages also fall back to it.
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (getOfflineRole()) return (await loadOfflineDemo()).offlineRequest<T>(path, options);
  try {
    return await networkRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 0 && isPublicRead(path, options)) return (await loadOfflineDemo()).offlineRequest<T>(path, options);
    throw error;
  }
}

async function networkRequest<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/v1${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(UNREACHABLE, 0);
  }
  // A static host without the API answers /api/* with its HTML page (or a bare 404). Treat that as
  // "server unreachable" instead of pretending it was a real API response.
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
    throw new ApiError(UNREACHABLE, 0, "API_UNAVAILABLE");
  }
  const result = (await response.json().catch(() => ({}))) as T & { message?: string; code?: string; errors?: Array<{ msg?: string; message?: string }> };
  if (!response.ok) {
    const raw = result.message ?? result.errors?.[0]?.msg ?? result.errors?.[0]?.message ?? "Something went wrong. Please try again.";
    throw new ApiError(humanize(raw, response.status), response.status, result.code);
  }
  return result;
}

export function appRoleFromUser(user: Pick<AuthUser, "role">): AppRole | null {
  if (user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN") return "admin";
  if (user.role === "TEACHER") return "teacher";
  if (user.role === "STUDENT") return "student";
  return null;
}

export function homePathFor(role: AppRole | null): string {
  return role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : role === "student" ? "/student" : "/login";
}

export async function login(input: { identifier: string; password: string; role: "staff" | "student"; schoolId?: string }): Promise<AuthUser> {
  try {
    const result = await request<{ user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    return result.user;
  } catch (error) {
    // No API (e.g. static hosting): the demo accounts still open the sample school in the browser.
    if (!(error instanceof ApiError) || error.status !== 0) throw error;
    const { offlineLogin } = await loadOfflineDemo();
    try {
      return offlineLogin(input);
    } catch {
      throw error;
    }
  }
}

export async function getMe(): Promise<Me | null> {
  try {
    return await request<Me>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) return null;
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

export type RegistrationResult = { message?: string; devCode?: string; user?: AuthUser };

export async function registerForRole(kind: "school" | "teacher" | "student", input: Record<string, unknown>): Promise<RegistrationResult> {
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

/** Demo accounts created by the seed (server/services/seedDemoData.ts). Public by design. */
export const DEMO_ACCOUNTS = {
  admin: { role: "staff" as const, identifier: "admin@classsync.school", password: "admin123", label: "Principal", name: "Ananya Sharma" },
  teacher: { role: "staff" as const, identifier: "teacher@classsync.school", password: "teacher123", label: "Teacher", name: "Vikram Singh" },
  student: { role: "student" as const, identifier: "A1042", password: "student123", schoolId: "68f000000000000000000001", label: "Student", name: "Aarohi Gupta" },
};
