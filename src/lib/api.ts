import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./auth-api";

/* ------------------------------------------------------------------ types */

export type CoverageStatus = "covered" | "suggested" | "uncovered";
export type CoverageRow = {
  id: string;
  period: number;
  time: string;
  classId: string;
  className: string;
  subject: string;
  absentTeacher: { id: string; name: string };
  substitute: { id: string; name: string } | null;
  status: CoverageStatus;
  acknowledged: boolean;
  selfStudy: boolean;
};
export type CoverageAbsence = { id: string; teacherId: string; name: string; category: string; isFullDay: boolean; periods: number[]; reason: string; periodsToCover: number; periodsCovered: number };
export type Coverage = { date: string; day: string; rows: CoverageRow[]; absences: CoverageAbsence[]; totals: { periods: number; covered: number; suggested: number; uncovered: number } };
export type Candidate = { id: string; name: string; category: string; sameSubject: boolean; knowsClass: boolean; load: number; reasons: string[]; score: number };

export type WeekEntry = { day: string; periodNumber: number; subject: string; teacher: string; teacherId: string; className: string; room: string; clash?: string; substitute?: string };
export type Week = { entries: WeekEntry[]; clashes: number; checked: number; published: boolean; publishedAt?: string };

export type ClassSection = { _id: string; grade: number; section: string; stream?: string | null; roomNumber?: string };
export type TeacherRecord = { _id: string; name: string; email?: string; qualificationCategory: string; primarySubjects: string[]; userId?: string | null };
export type Subject = { _id: string; name: string; code: string };

export type RequestType = "PERIOD_SWAP" | "COMBINED_CLASS" | "CONSECUTIVE_PERIODS" | "EXTRA_PERIOD" | "LEAVE_NOTICE";
export type RequestStatus = "PENDING_COUNTERPART" | "PENDING_ADMIN" | "APPROVED" | "REJECTED";
export type SchoolRequest = {
  id: string; type: RequestType; status: RequestStatus; date: string; requester: string; counterpart: string;
  className: string; otherClassName: string; subject: string; periodNumber: number | null; otherPeriodNumber: number | null;
  reason: string; decisionNote: string; createdAt: string;
};

export type Person = {
  id: string; name: string; role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT"; status: "PENDING" | "ACTIVE" | "SUSPENDED";
  email: string; phone: string; admissionNumber: string; category: string; subjects: string[]; className: string; createdAt: string; isSelf: boolean;
};

export type Notice = { id: string; title: string; body: string; audience: "ALL" | "STAFF" | "STUDENTS"; createdAt: string };
export type AppNotification = { id: string; title: string; message: string; link: string; read: boolean; createdAt: string };

export type ComplaintCategory = "HYGIENE" | "FACILITIES" | "TIMETABLE" | "ACADEMICS" | "BULLYING" | "HARASSMENT" | "SAFETY" | "TEACHER_CONDUCT";
export type Complaint = {
  _id: string; category: ComplaintCategory; status: "OPEN" | "SEEN" | "RESOLVED"; serious: boolean; anonymous?: boolean; place?: string; message?: string;
  resolutionNote?: string; createdAt: string; studentId?: { name?: string; admissionNumber?: string } | null; classSectionId?: { grade?: number; section?: string } | null;
};

export type MyDay = {
  date: string; day: string; teacher: { id: string; name: string }; onLeave: boolean;
  classes: Array<{ period: number; time: string; className: string; subject: string; room: string; kind: "class"; onLeave: boolean }>;
  duties: Array<{ id: string; period: number; time: string; className: string; subject: string; coveringFor: string; acknowledged: boolean; kind: "duty" }>;
};

/* ------------------------------------------------------------------ queries */

const json = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

export const useCoverage = (date: string) => useQuery({ queryKey: ["coverage", date], queryFn: () => request<Coverage>(`/school/coverage?date=${date}`) });
export const useCandidates = (rowId: string | null) =>
  useQuery({ queryKey: ["candidates", rowId], enabled: Boolean(rowId), queryFn: () => request<{ row: CoverageRow; candidates: Candidate[] }>(`/school/coverage/${rowId}/candidates`) });
export const useWeek = (target: { classId?: string; teacherId?: string }, date?: string) => {
  const params = new URLSearchParams();
  if (target.classId) params.set("classId", target.classId);
  if (target.teacherId) params.set("teacherId", target.teacherId);
  if (date) params.set("date", date);
  return useQuery({ queryKey: ["week", target.classId ?? "", target.teacherId ?? "", date ?? ""], enabled: Boolean(target.classId || target.teacherId), queryFn: () => request<Week>(`/school/week?${params}`) });
};
export const useClasses = () => useQuery({ queryKey: ["classes"], queryFn: () => request<{ classes: ClassSection[] }>("/classes").then((data) => [...data.classes].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section))) });
export const useTeachers = () => useQuery({ queryKey: ["teachers"], queryFn: () => request<{ teachers: TeacherRecord[] }>("/teachers").then((data) => [...data.teachers].sort((a, b) => a.name.localeCompare(b.name))) });
export const useSubjects = () => useQuery({ queryKey: ["subjects"], queryFn: () => request<{ subjects: Subject[] }>("/subjects").then((data) => data.subjects) });
export const useAllRequests = () => useQuery({ queryKey: ["requests", "all"], queryFn: () => request<{ requests: SchoolRequest[] }>("/requests/all").then((data) => data.requests) });
export const useMyRequests = () => useQuery({ queryKey: ["requests", "mine"], queryFn: () => request<{ requests: SchoolRequest[] }>("/requests/mine").then((data) => data.requests) });
export const usePeople = () => useQuery({ queryKey: ["people"], queryFn: () => request<{ people: Person[] }>("/auth/admin/users").then((data) => data.people) });
export const useNotices = () => useQuery({ queryKey: ["notices"], queryFn: () => request<{ notices: Notice[] }>("/school/notices").then((data) => data.notices) });
export const useNotifications = () => useQuery({ queryKey: ["notifications"], queryFn: () => request<{ notifications: AppNotification[]; unread: number }>("/school/notifications"), refetchInterval: 60_000 });
export const useComplaints = () => useQuery({ queryKey: ["complaints", "all"], queryFn: () => request<{ complaints: Complaint[] }>("/complaints").then((data) => data.complaints) });
export const useMyComplaints = () => useQuery({ queryKey: ["complaints", "mine"], queryFn: () => request<{ complaints: Complaint[] }>("/complaints/mine").then((data) => data.complaints) });
export const useMyDay = (date: string) => useQuery({ queryKey: ["my-day", date], queryFn: () => request<MyDay>(`/school/my-day?date=${date}`) });

/* ---------------------------------------------------------------- mutations */

/** Wraps useMutation and refreshes the listed query groups afterwards. */
function useAction<TInput, TResult>(fn: (input: TInput) => Promise<TResult>, invalidate: string[][]) {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey }))) });
}

export const useAssignSubstitute = () =>
  useAction((input: { rowId: string; teacherId: string | null }) => request<{ row: CoverageRow }>(`/school/coverage/${input.rowId}/assign`, json({ teacherId: input.teacherId })), [["coverage"], ["candidates"], ["notifications"]]);
export const useConfirmSubstitute = () => useAction((rowId: string) => request<{ row: CoverageRow }>(`/school/coverage/${rowId}/confirm`, { method: "POST" }), [["coverage"]]);
export const useMarkAbsent = () =>
  useAction((input: { teacherId: string; date: string; isFullDay: boolean; affectedPeriods: number[]; reason: string }) => request("/absences", json(input)), [["coverage"], ["candidates"]]);
export const useRemoveAbsence = () => useAction((id: string) => request(`/absences/${id}`, { method: "DELETE" }), [["coverage"]]);
export const useDecideRequest = () =>
  useAction((input: { id: string; decision: "APPROVED" | "REJECTED"; note: string }) => request(`/requests/${input.id}/decision`, json({ decision: input.decision, note: input.note })), [["requests"], ["coverage"]]);
export const useCreateRequest = () =>
  useAction((input: { type: RequestType; date: string; payload: Record<string, unknown> }) => request("/requests", json(input)), [["requests"]]);
export const useSetPersonStatus = () =>
  useAction((input: { id: string; status: "ACTIVE" | "SUSPENDED"; pending: boolean }) =>
    input.pending ? request(`/auth/admin/approvals/${input.id}`, { method: "PATCH", body: JSON.stringify({ status: input.status }) }) : request(`/auth/admin/users/${input.id}/status`, { method: "PATCH", body: JSON.stringify({ status: input.status }) }), [["people"]]);
export const useCreatePerson = () => useAction((input: Record<string, unknown>) => request("/auth/admin/users", json(input)), [["people"], ["teachers"]]);
export const useCreateNotice = () => useAction((input: { title: string; body: string; audience: Notice["audience"] }) => request("/school/notices", json(input)), [["notices"]]);
export const useDeleteNotice = () => useAction((id: string) => request(`/school/notices/${id}`, { method: "DELETE" }), [["notices"]]);
export const useReadNotifications = () => useAction(() => request("/school/notifications/read", { method: "POST" }), [["notifications"]]);
export const useUpdateComplaint = () =>
  useAction((input: { id: string; status: "SEEN" | "RESOLVED"; resolutionNote?: string }) => request(`/complaints/${input.id}`, { method: "PATCH", body: JSON.stringify({ status: input.status, resolutionNote: input.resolutionNote }) }), [["complaints"]]);
export const useCreateComplaint = () =>
  useAction((input: { category: ComplaintCategory; message: string; place?: string; anonymous: boolean }) => request("/complaints", json(input)), [["complaints"]]);
export const useAcknowledgeDuty = () => useAction((id: string) => request(`/substitutions/${id}/seen`, { method: "PATCH" }), [["my-day"]]);
export const useUpdateProfile = () => useAction((input: { name: string; phone: string }) => request("/auth/me", { method: "PATCH", body: JSON.stringify(input) }), [["me"]]);
export const useChangePassword = () => useAction((input: { currentPassword: string; newPassword: string }) => request("/auth/me/password", json(input)), []);

/* ------------------------------------------------------------------ labels */

export const REQUEST_LABEL: Record<RequestType, string> = {
  LEAVE_NOTICE: "Leave",
  PERIOD_SWAP: "Period swap",
  EXTRA_PERIOD: "Extra period",
  CONSECUTIVE_PERIODS: "Double period",
  COMBINED_CLASS: "Combined class",
};

export const COMPLAINT_LABEL: Record<ComplaintCategory, string> = {
  HYGIENE: "Cleanliness",
  FACILITIES: "Facilities",
  TIMETABLE: "Timetable",
  ACADEMICS: "Studies",
  BULLYING: "Bullying",
  HARASSMENT: "Harassment",
  SAFETY: "Safety",
  TEACHER_CONDUCT: "Teacher conduct",
};
