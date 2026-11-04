/**
 * Records the sample school's API responses into src/demo/snapshot.json so the "Try the sample
 * school" buttons work on static hosting (e.g. Lovable) where no API server runs.
 *
 * It boots the real API with DEMO_MODE=true (fresh seed), signs in as each demo account and saves
 * every read the app screens make. Re-run after changing the seed or the read models:
 *
 *   npm run demo:capture
 */
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.CAPTURE_PORT ?? 4123);
const BASE = `http://localhost:${PORT}/api/v1`;
const OUT = path.resolve("src/demo/snapshot.json");
const DEMO_SCHOOL_ID = "68f000000000000000000001";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const ACCOUNTS = {
  admin: { role: "staff", identifier: "admin@classsync.school", password: "admin123" },
  teacher: { role: "staff", identifier: "teacher@classsync.school", password: "teacher123" },
  student: { role: "student", identifier: "A1042", password: "student123", schoolId: DEMO_SCHOOL_ID },
} as const;
type RoleKey = keyof typeof ACCOUNTS;

const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};
const dayOf = (iso: string) => DAYS[new Date(`${iso}T12:00:00`).getDay()];

/** Same rule as the seed and the client: today, or Monday when today is Sunday. */
function schoolToday() {
  const date = new Date();
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return isoDate(date);
}

async function waitForHealth(timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${PORT}/health`);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The API did not start in time.");
}

async function signIn(key: RoleKey) {
  const response = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ACCOUNTS[key]) });
  if (!response.ok) throw new Error(`Login failed for ${key}: ${response.status} ${await response.text()}`);
  const cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];
  const { user } = (await response.json()) as { user: unknown };
  const get = async <T>(pathname: string): Promise<T> => {
    const result = await fetch(`${BASE}${pathname}`, { headers: { cookie } });
    if (!result.ok) throw new Error(`GET ${pathname} as ${key} failed: ${result.status} ${await result.text()}`);
    return (await result.json()) as T;
  };
  return { user, get };
}

async function capture() {
  const today = schoolToday();
  const admin = await signIn("admin");
  const teacher = await signIn("teacher");
  const student = await signIn("student");

  // A clean week (no absences or requests) a week from now gives "ordinary day" data per weekday.
  const plainDates = Array.from({ length: 7 }, (_, index) => addDays(today, 7 + index));

  const coverageToday = await admin.get<{ rows: Array<{ id: string }> }>(`/school/coverage?date=${today}`);
  const coverageByDay: Record<string, unknown> = {};
  for (const date of plainDates) coverageByDay[dayOf(date)] = await admin.get(`/school/coverage?date=${date}`);

  const candidates: Record<string, unknown> = {};
  for (const row of coverageToday.rows) candidates[row.id] = await admin.get(`/school/coverage/${row.id}/candidates`);

  const myDayToday = await teacher.get(`/school/my-day?date=${today}`);
  const myDayByDay: Record<string, unknown> = {};
  for (const date of plainDates) myDayByDay[dayOf(date)] = await teacher.get(`/school/my-day?date=${date}`);

  const { classes } = await admin.get<{ classes: Array<{ _id: string; grade: number; section: string }> }>("/classes");
  const { teachers } = await admin.get<{ teachers: Array<{ _id: string }> }>("/teachers");
  const weeks: Record<string, { dated: unknown; plain: unknown }> = {};
  for (const item of classes) {
    weeks[`class:${item._id}`] = { dated: await admin.get(`/school/week?classId=${item._id}&date=${today}`), plain: await admin.get(`/school/week?classId=${item._id}`) };
  }
  for (const item of teachers) {
    weeks[`teacher:${item._id}`] = { dated: await admin.get(`/school/week?teacherId=${item._id}&date=${today}`), plain: await admin.get(`/school/week?teacherId=${item._id}`) };
  }

  const publicTimetables: Record<string, unknown> = {};
  for (const item of classes) publicTimetables[`${item.grade}-${item.section}`] = await admin.get(`/timetable/public?schoolId=${DEMO_SCHOOL_ID}&grade=${item.grade}&section=${item.section}`);

  const roles = {} as Record<RoleKey, unknown>;
  for (const [key, session] of [["admin", admin], ["teacher", teacher], ["student", student]] as const) {
    roles[key] = {
      user: session.user,
      me: await session.get("/auth/me"),
      notices: await session.get("/school/notices"),
      notifications: await session.get("/school/notifications"),
    };
  }

  const schools = await admin.get<{ schools: Array<{ _id: string }> }>("/auth/public/schools?q=Greenfield");

  return {
    capturedAt: new Date().toISOString(),
    today,
    roles,
    coverage: { today: coverageToday, byDay: coverageByDay },
    candidates,
    myDay: { today: myDayToday, byDay: myDayByDay },
    weeks,
    classes: { classes },
    teachers: { teachers },
    subjects: await admin.get("/subjects"),
    people: await admin.get("/auth/admin/users"),
    requestsAll: await admin.get("/requests/all"),
    requestsMine: await teacher.get("/requests/mine"),
    complaintsAll: await admin.get("/complaints"),
    complaintsMine: await student.get("/complaints/mine"),
    publicSchools: { schools: schools.schools.filter((school) => school._id === DEMO_SCHOOL_ID) },
    publicClasses: await admin.get(`/auth/public/schools/${DEMO_SCHOOL_ID}/classes`),
    publicTimetables,
  };
}

const server = spawn(process.execPath, ["--import", "tsx", "--import", "dotenv/config", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DEMO_MODE: "true", NODE_ENV: "development", CLIENT_URL: "http://localhost:5173" },
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  await waitForHealth();
  const snapshot = await capture();
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(snapshot)}\n`);
  console.log(`Saved the sample school (${snapshot.today}) to ${path.relative(process.cwd(), OUT)}`);
} finally {
  server.kill();
}
