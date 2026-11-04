/**
 * The sample school, running entirely in the browser.
 *
 * Used when the "Try the sample school" buttons can't reach an API (e.g. the static production
 * build on Lovable). Reads come from src/demo/snapshot.json, recorded from the real API by
 * `npm run demo:capture`; changes (confirming a substitute, approving a request, posting a
 * notice…) are kept in this browser until the visitor signs out.
 *
 * Dates are moved so the recorded "today" becomes the visitor's today, and the recorded weekday
 * swaps places with today's weekday in timetables, so every screen stays consistent.
 */
import { toast } from "sonner";
import { ApiError, DEMO_ACCOUNTS, type AuthUser, type Me, type PublicClassSection, type PublicSchool, type PublicTimetable } from "@/lib/auth-api";
import type { AppNotification, Candidate, ClassSection, Complaint, Coverage, CoverageRow, MyDay, Notice, Person, SchoolRequest, Subject, TeacherRecord, Week } from "@/lib/api";
import { currentSchoolDate, PERIODS, toIsoDate } from "@/lib/school-time";
import { getOfflineRole, setOfflineRole, STATE_KEY, type DemoRole } from "./mode";
import snapshot from "./snapshot.json";

type RoleData = { user: AuthUser; me: Me; notices: { notices: Notice[] }; notifications: { notifications: AppNotification[]; unread: number } };
type State = {
  today: string;
  capturedToday: string;
  roles: Record<DemoRole, RoleData>;
  coverage: { today: Coverage; byDay: Record<string, Coverage> };
  candidates: Record<string, { row: CoverageRow; candidates: Candidate[] }>;
  myDay: { today: MyDay; byDay: Record<string, MyDay> };
  weeks: Record<string, { dated: Week; plain: Week }>;
  classes: { classes: ClassSection[] };
  teachers: { teachers: TeacherRecord[] };
  subjects: { subjects: Subject[] };
  people: { people: Person[] };
  requestsAll: { requests: SchoolRequest[] };
  requestsMine: { requests: SchoolRequest[] };
  complaintsAll: { complaints: Complaint[] };
  complaintsMine: { complaints: Complaint[] };
  publicSchools: { schools: PublicSchool[] };
  publicClasses: { classes: PublicClassSection[] };
  publicTimetables: Record<string, PublicTimetable>;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayOf = (iso: string) => DAY_NAMES[new Date(`${iso}T12:00:00`).getDay()];
const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000);
const shiftIso = (iso: string, days: number) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};
/** "09:00–09:40", the format the API uses. */
const periodTime = (number: number) => {
  const slot = PERIODS.find((item) => item.number === number);
  return slot ? `${slot.start}–${slot.end}` : "";
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const newId = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

/* ------------------------------------------------------------------ state */

function buildState(): State {
  const today = toIsoDate(currentSchoolDate());
  const offset = daysBetween(snapshot.today, today);
  // Move every date and timestamp by the same number of days, so "in 2 days" stays "in 2 days".
  const text = JSON.stringify(snapshot).replace(/"(\d{4}-\d{2}-\d{2})(T[^"]*)?"/g, (_match, date: string, time = "") => `"${shiftIso(date, offset)}${time}"`);
  const state = { ...(JSON.parse(text) as Omit<State, "today" | "capturedToday">), today, capturedToday: snapshot.today } as State;

  const recordedDay = dayOf(snapshot.today);
  const todayName = dayOf(today);
  const swap = (day: string) => (day === recordedDay ? todayName : day === todayName ? recordedDay : day);
  for (const week of Object.values(state.weeks)) for (const entry of [...week.dated.entries, ...week.plain.entries]) entry.day = swap(entry.day);
  // Ordinary (no absences) days, keyed by the weekday they will be shown as.
  const coverageByDay: Record<string, Coverage> = {};
  const myDayByDay: Record<string, MyDay> = {};
  for (const day of DAY_NAMES) {
    coverageByDay[swap(day)] = state.coverage.byDay[day];
    myDayByDay[swap(day)] = state.myDay.byDay[day];
  }
  state.coverage.byDay = coverageByDay;
  state.myDay.byDay = myDayByDay;
  state.coverage.today.day = todayName;
  state.myDay.today.day = todayName;
  return state;
}

let cached: State | null = null;

function load(): State {
  if (cached) return cached;
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as State;
      if (parsed.today === toIsoDate(currentSchoolDate()) && parsed.capturedToday === snapshot.today) return (cached = parsed);
    }
  } catch {
    /* fall through to a fresh copy */
  }
  return (cached = buildState());
}

function save() {
  try {
    if (cached) localStorage.setItem(STATE_KEY, JSON.stringify(cached));
  } catch {
    /* storage full or blocked: changes last until reload */
  }
}

/* ---------------------------------------------------------------- sign in */

export function offlineLogin(input: { identifier: string; password: string; role: "staff" | "student" }): AuthUser {
  const identifier = input.identifier.trim().toLowerCase();
  const role = (Object.keys(DEMO_ACCOUNTS) as DemoRole[]).find((key) => {
    const account = DEMO_ACCOUNTS[key];
    return account.role === input.role && account.identifier.toLowerCase() === identifier && account.password === input.password;
  });
  if (!role) throw new ApiError("That email, phone or password doesn't match our records.", 401);
  cached = null;
  setOfflineRole(role);
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
  toast("You're exploring the sample school", { description: "Everything you change stays in this browser until you sign out." });
  return clone(load().roles[role].user);
}

/* ------------------------------------------------------------- coverage helpers */

function recountCoverage(coverage: Coverage) {
  coverage.totals = {
    periods: coverage.rows.length,
    covered: coverage.rows.filter((row) => row.status === "covered").length,
    suggested: coverage.rows.filter((row) => row.status === "suggested").length,
    uncovered: coverage.rows.filter((row) => row.status === "uncovered").length,
  };
  for (const absence of coverage.absences) {
    const rows = coverage.rows.filter((row) => row.absentTeacher.id === absence.teacherId);
    absence.periodsToCover = rows.length;
    absence.periodsCovered = rows.filter((row) => row.status === "covered").length;
  }
}

function teacherEntriesToday(state: State, teacherId: string) {
  const todayName = dayOf(state.today);
  return state.weeks[`teacher:${teacherId}`]?.plain.entries.filter((entry) => entry.day === todayName) ?? [];
}

/** Free, eligible teachers for a period that has no recorded suggestions (e.g. a newly added absence). */
function computeCandidates(state: State, row: CoverageRow): Candidate[] {
  const coverage = state.coverage.today;
  const absentIds = new Set(coverage.absences.filter((item) => item.isFullDay || item.periods.includes(row.period)).map((item) => item.teacherId));
  return state.teachers.teachers
    .filter((teacher) => teacher._id !== row.absentTeacher.id && !absentIds.has(teacher._id))
    .map((teacher) => {
      const entries = teacherEntriesToday(state, teacher._id);
      const duties = coverage.rows.filter((other) => other.substitute?.id === teacher._id);
      if (entries.some((entry) => entry.periodNumber === row.period) || duties.some((other) => other.period === row.period)) return null;
      const load = entries.length + duties.length;
      if (load >= 6) return null;
      const sameSubject = teacher.primarySubjects.some((subject) => subject === row.subject || state.subjects.subjects.find((item) => item._id === subject)?.name === row.subject);
      const knowsClass = Boolean(state.weeks[`teacher:${teacher._id}`]?.plain.entries.some((entry) => entry.className === row.className));
      const reasons = [`Free in period ${row.period}`];
      if (sameSubject) reasons.push(`Teaches ${row.subject || "this subject"}`);
      if (knowsClass) reasons.push(`Already teaches ${row.className}`);
      reasons.push(load <= 3 ? `Light day: ${load} periods` : `${load} periods today`);
      return { id: teacher._id, name: teacher.name, category: teacher.qualificationCategory, sameSubject, knowsClass, load, reasons, score: (sameSubject ? 50 : 0) + (knowsClass ? 25 : 0) + (6 - load) * 5 };
    })
    .filter((item): item is Candidate => item !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 6);
}

function notify(state: State, role: DemoRole, title: string, message: string, link: string) {
  const box = state.roles[role].notifications;
  box.notifications.unshift({ id: newId(), title, message, link, read: false, createdAt: new Date().toISOString() });
  box.unread = box.notifications.filter((item) => !item.read).length;
}

function rowById(state: State, id: string) {
  const row = state.coverage.today.rows.find((item) => item.id === id);
  if (!row) throw new ApiError("That period was not found.", 404);
  return row;
}

/* ---------------------------------------------------------------- requests */

type Body = Record<string, unknown>;
const NOT_IN_DEMO = (what: string) => new ApiError(`${what} isn't available in the sample school. Set up your own school to try it.`, 400);

function handle(state: State, role: DemoRole | null, method: string, pathname: string, query: URLSearchParams, body: Body): unknown {
  const parts = pathname.split("/").filter(Boolean);
  const route = `${method} ${pathname}`;

  /* public pages (no sign-in) */
  if (route === "GET /auth/public/schools") {
    const q = (query.get("q") ?? "").toLowerCase();
    return { schools: state.publicSchools.schools.filter((school) => !q || [school.name, school.city, school.state].some((value) => value?.toLowerCase().includes(q))) };
  }
  if (method === "GET" && parts[0] === "auth" && parts[1] === "public" && parts[4] === "classes") return parts[3] === state.publicSchools.schools[0]?._id ? state.publicClasses : { classes: [] };
  if (route === "GET /timetable/public") {
    const timetable = state.publicTimetables[`${query.get("grade")}-${(query.get("section") ?? "").toUpperCase()}`];
    if (!timetable) throw new ApiError("We couldn't find that class.", 404);
    return timetable;
  }

  if (route === "POST /auth/logout") {
    setOfflineRole(null);
    cached = null;
    return { success: true };
  }
  if (!role) throw new ApiError("Please sign in again.", 401);
  const mine = state.roles[role];
  const isAdmin = role === "admin";

  switch (route) {
    case "GET /auth/me":
      return mine.me;
    case "PATCH /auth/me": {
      const profile = { ...mine.me.user.profile, name: String(body.name ?? ""), phone: String(body.phone ?? "") };
      mine.me.user.profile = profile;
      mine.user.profile = profile;
      return { user: mine.me.user };
    }
    case "POST /auth/me/password":
      throw NOT_IN_DEMO("Changing the password");
    case "GET /classes":
      return state.classes;
    case "GET /teachers":
      return state.teachers;
    case "GET /subjects":
      return state.subjects;
    case "GET /auth/admin/users":
      return state.people;
    case "POST /auth/admin/users": {
      const className = state.classes.classes.find((item) => item._id === body.classSectionId);
      const person: Person = {
        id: newId(), name: String(body.name ?? ""), role: body.role === "STUDENT" ? "STUDENT" : "TEACHER", status: "ACTIVE", email: String(body.email ?? ""), phone: "",
        admissionNumber: String(body.admissionNumber ?? ""), category: "", subjects: [], className: className ? `${className.grade}-${className.section}` : "", createdAt: new Date().toISOString(), isSelf: false,
      };
      state.people.people.unshift(person);
      return { user: person };
    }
    case "GET /school/coverage": {
      const date = query.get("date") ?? state.today;
      if (date === state.today) return state.coverage.today;
      const plain = clone(state.coverage.byDay[dayOf(date)] ?? state.coverage.byDay.Sunday);
      return { ...plain, date, day: dayOf(date) };
    }
    case "GET /school/my-day": {
      const date = query.get("date") ?? state.today;
      if (date === state.today) return state.myDay.today;
      const plain = clone(state.myDay.byDay[dayOf(date)] ?? state.myDay.byDay.Sunday);
      return { ...plain, date, day: dayOf(date) };
    }
    case "GET /school/week": {
      const target = query.get("classId") ? `class:${query.get("classId")}` : `teacher:${query.get("teacherId")}`;
      const week = state.weeks[target];
      if (!week) return { entries: [], clashes: 0, checked: 0, published: false };
      return query.get("date") === state.today ? week.dated : week.plain;
    }
    case "GET /school/notices":
      return mine.notices;
    case "POST /school/notices": {
      const notice: Notice = { id: newId(), title: String(body.title ?? ""), body: String(body.body ?? ""), audience: (body.audience as Notice["audience"]) ?? "ALL", createdAt: new Date().toISOString() };
      state.roles.admin.notices.notices.unshift(notice);
      if (notice.audience !== "STUDENTS") state.roles.teacher.notices.notices.unshift(clone(notice));
      if (notice.audience !== "STAFF") state.roles.student.notices.notices.unshift(clone(notice));
      return { notice };
    }
    case "GET /school/notifications":
      return mine.notifications;
    case "POST /school/notifications/read":
      mine.notifications.notifications.forEach((item) => (item.read = true));
      mine.notifications.unread = 0;
      return { success: true };
    case "GET /requests/all":
      return state.requestsAll;
    case "GET /requests/mine":
      return state.requestsMine;
    case "POST /requests": {
      const payload = (body.payload ?? {}) as Body;
      const schoolClass = state.classes.classes.find((item) => item._id === payload.classSectionId);
      const request: SchoolRequest = {
        id: newId(), type: body.type as SchoolRequest["type"], status: "PENDING_ADMIN", date: String(body.date ?? state.today), requester: mine.me.teacher?.name ?? "", counterpart: "",
        className: schoolClass ? `${schoolClass.grade}-${schoolClass.section}` : "", otherClassName: "", subject: state.subjects.subjects.find((item) => item._id === payload.subjectId)?.name ?? "",
        periodNumber: typeof payload.periodNumber === "number" ? payload.periodNumber : null, otherPeriodNumber: typeof payload.otherPeriodNumber === "number" ? payload.otherPeriodNumber : null,
        reason: String(payload.reason ?? ""), decisionNote: "", createdAt: new Date().toISOString(),
      };
      state.requestsMine.requests.unshift(request);
      state.requestsAll.requests.unshift(clone(request));
      notify(state, "admin", "New request", `${request.requester} sent a request for ${request.date}.`, "/admin/requests");
      return { request };
    }
    case "GET /complaints":
      return state.complaintsAll;
    case "GET /complaints/mine":
      return state.complaintsMine;
    case "POST /complaints": {
      const student = mine.me.student;
      const anonymous = Boolean(body.anonymous);
      const complaint: Complaint = {
        _id: newId(), category: body.category as Complaint["category"], status: "OPEN", serious: ["BULLYING", "HARASSMENT", "SAFETY", "TEACHER_CONDUCT"].includes(String(body.category)), anonymous,
        place: body.place ? String(body.place) : undefined, message: String(body.message ?? ""), createdAt: new Date().toISOString(),
      };
      state.complaintsMine.complaints.unshift(complaint);
      state.complaintsAll.complaints.unshift({
        ...clone(complaint),
        studentId: anonymous || !student ? null : { name: student.name, admissionNumber: student.admissionNumber },
        classSectionId: student?.classSectionId ? { grade: student.classSectionId.grade, section: student.classSectionId.section } : null,
      });
      return { complaint };
    }
  }

  /* routes with an id */
  const id = parts[2] ?? parts[1];
  if (method === "GET" && parts[0] === "school" && parts[1] === "coverage" && parts[3] === "candidates") {
    const row = rowById(state, parts[2]);
    const recorded = state.candidates[row.id];
    const busy = new Set(state.coverage.today.rows.filter((other) => other.id !== row.id && other.period === row.period && other.substitute).map((other) => other.substitute!.id));
    return { row, candidates: recorded ? recorded.candidates.filter((item) => !busy.has(item.id) && item.id !== row.substitute?.id) : computeCandidates(state, row) };
  }
  if (method === "POST" && parts[0] === "school" && parts[1] === "coverage" && (parts[3] === "assign" || parts[3] === "confirm")) {
    if (!isAdmin) throw new ApiError("Only the school office can do that.", 403);
    const row = rowById(state, parts[2]);
    if (parts[3] === "assign") {
      const teacher = body.teacherId ? state.teachers.teachers.find((item) => item._id === body.teacherId) : null;
      row.substitute = teacher ? { id: teacher._id, name: teacher.name } : null;
      row.status = teacher ? "covered" : "uncovered";
      row.selfStudy = !teacher;
      row.acknowledged = false;
    } else {
      if (!row.substitute) throw new ApiError("There is no suggested substitute to confirm for this period.", 404);
      row.status = "covered";
    }
    if (row.substitute?.id === state.roles.teacher.me.teacher?._id) {
      const duties = state.myDay.today.duties.filter((duty) => duty.id !== row.id);
      duties.push({ id: row.id, period: row.period, time: periodTime(row.period), className: row.className, subject: row.subject, coveringFor: row.absentTeacher.name, acknowledged: false, kind: "duty" });
      state.myDay.today.duties = duties.sort((a, b) => a.period - b.period);
      notify(state, "teacher", "New cover duty", `Please cover ${row.className} ${row.subject} in period ${row.period}.`, "/teacher/dashboard");
    } else {
      state.myDay.today.duties = state.myDay.today.duties.filter((duty) => duty.id !== row.id);
    }
    recountCoverage(state.coverage.today);
    return { row };
  }
  if (method === "POST" && pathname === "/absences") {
    if (body.date !== state.today) return { success: true };
    const teacherId = String(body.teacherId ?? "");
    const teacher = state.teachers.teachers.find((item) => item._id === teacherId);
    if (!teacher) throw new ApiError("That teacher was not found.", 404);
    const coverage = state.coverage.today;
    if (coverage.absences.some((item) => item.teacherId === teacherId)) throw new ApiError(`${teacher.name} is already marked absent today.`, 409);
    const isFullDay = Boolean(body.isFullDay);
    const periods = Array.isArray(body.affectedPeriods) ? (body.affectedPeriods as number[]) : [];
    coverage.absences.push({ id: newId(), teacherId, name: teacher.name, category: teacher.qualificationCategory, isFullDay, periods, reason: String(body.reason ?? ""), periodsToCover: 0, periodsCovered: 0 });
    for (const entry of teacherEntriesToday(state, teacherId)) {
      if (!isFullDay && !periods.includes(entry.periodNumber)) continue;
      const schoolClass = state.classes.classes.find((item) => `${item.grade}-${item.section}` === entry.className);
      coverage.rows.push({
        id: newId(), period: entry.periodNumber, time: periodTime(entry.periodNumber), classId: schoolClass?._id ?? "", className: entry.className, subject: entry.subject,
        absentTeacher: { id: teacherId, name: teacher.name }, substitute: null, status: "uncovered", acknowledged: false, selfStudy: false,
      });
    }
    coverage.rows.sort((a, b) => a.period - b.period || a.className.localeCompare(b.className));
    recountCoverage(coverage);
    return { success: true };
  }
  if (method === "DELETE" && parts[0] === "absences") {
    const coverage = state.coverage.today;
    const absence = coverage.absences.find((item) => item.id === parts[1]);
    if (absence) {
      const removed = new Set(coverage.rows.filter((row) => row.absentTeacher.id === absence.teacherId).map((row) => row.id));
      coverage.absences = coverage.absences.filter((item) => item.id !== absence.id);
      coverage.rows = coverage.rows.filter((row) => !removed.has(row.id));
      state.myDay.today.duties = state.myDay.today.duties.filter((duty) => !removed.has(duty.id));
      recountCoverage(coverage);
    }
    return { success: true };
  }
  if (method === "PATCH" && parts[0] === "substitutions" && parts[2] === "seen") {
    const duty = state.myDay.today.duties.find((item) => item.id === parts[1]);
    if (duty) duty.acknowledged = true;
    const row = state.coverage.today.rows.find((item) => item.id === parts[1]);
    if (row) row.acknowledged = true;
    return { success: true };
  }
  if (method === "DELETE" && parts[0] === "school" && parts[1] === "notices") {
    for (const box of Object.values(state.roles)) box.notices.notices = box.notices.notices.filter((notice) => notice.id !== id);
    return { success: true };
  }
  if (method === "POST" && parts[0] === "requests" && parts[2] === "decision") {
    const status = body.decision === "APPROVED" ? "APPROVED" : "REJECTED";
    for (const list of [state.requestsAll.requests, state.requestsMine.requests]) {
      const request = list.find((item) => item.id === parts[1]);
      if (request) Object.assign(request, { status, decisionNote: String(body.note ?? "") });
    }
    return { success: true };
  }
  if (method === "PATCH" && parts[0] === "complaints") {
    for (const list of [state.complaintsAll.complaints, state.complaintsMine.complaints]) {
      const complaint = list.find((item) => item._id === parts[1]);
      if (complaint) Object.assign(complaint, { status: body.status, ...(body.resolutionNote !== undefined ? { resolutionNote: String(body.resolutionNote) } : {}) });
    }
    return { success: true };
  }
  if (method === "PATCH" && parts[0] === "auth" && parts[1] === "admin" && (parts[2] === "approvals" || parts[2] === "users")) {
    const person = state.people.people.find((item) => item.id === parts[3]);
    if (person) person.status = body.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
    return { success: true };
  }
  if (method === "GET") throw new ApiError("That page isn't part of the sample school.", 404);
  throw NOT_IN_DEMO("This action");
}

/** Answers an API call from the in-browser sample school. Mirrors the server's response shapes. */
export async function offlineRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const state = load();
  const url = new URL(path, "http://sample.school");
  const method = (options.method ?? "GET").toUpperCase();
  let body: Body = {};
  try {
    body = typeof options.body === "string" ? (JSON.parse(options.body) as Body) : {};
  } catch {
    body = {};
  }
  const result = handle(state, getOfflineRole(), method, url.pathname.replace(/\/+$/, ""), url.searchParams, body);
  if (method !== "GET" && cached) save();
  // Hand out copies so React Query never sees the in-memory state change under it.
  return clone(result) as T;
}
