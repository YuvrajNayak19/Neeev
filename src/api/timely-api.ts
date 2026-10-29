import { generateCoverageSchedule } from "../lib/coverage-engine";
import type { Absence, CreateAbsenceInput, CreateTeacherInput, DashboardStats, Period, PeriodMap, Schedule, SchoolSession, Teacher } from "../types/domain";

const SCHOOL_ID = "school-greenfield";
const STORAGE_KEY = "timely-demo-store-v1";
const wait = (): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, 280));
const periods = (): PeriodMap => ({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false });

interface PersistedStore {
  teachers: Teacher[];
  absences: Absence[];
  schedules: Schedule[];
}

const session: SchoolSession = {
  schoolId: SCHOOL_ID,
  schoolName: "Greenfield Public School",
  userName: "Ananya Sharma",
  role: "admin",
};

const seedTeachers: Teacher[] = [
  { id: "t-01", schoolId: SCHOOL_ID, name: "Aarav Mehta", subject: "Mathematics", category: "PGT", busyPeriods: { ...periods(), 1: true, 3: true, 6: true } },
  { id: "t-02", schoolId: SCHOOL_ID, name: "Diya Kapoor", subject: "English", category: "PGT", busyPeriods: { ...periods(), 2: true, 4: true, 7: true } },
  { id: "t-03", schoolId: SCHOOL_ID, name: "Kabir Singh", subject: "Science", category: "TGT", busyPeriods: { ...periods(), 1: true, 5: true, 8: true } },
  { id: "t-04", schoolId: SCHOOL_ID, name: "Meera Iyer", subject: "Hindi", category: "TGT", busyPeriods: { ...periods(), 3: true, 4: true, 6: true } },
  { id: "t-05", schoolId: SCHOOL_ID, name: "Rohan Verma", subject: "Social Science", category: "TGT", busyPeriods: { ...periods(), 2: true, 5: true, 7: true } },
  { id: "t-06", schoolId: SCHOOL_ID, name: "Sana Khan", subject: "Mathematics", category: "TGT", busyPeriods: { ...periods(), 1: true, 4: true, 6: true } },
  { id: "t-07", schoolId: SCHOOL_ID, name: "Vikram Rao", subject: "Computer Science", category: "PGT", busyPeriods: { ...periods(), 2: true, 3: true, 8: true } },
  { id: "t-08", schoolId: SCHOOL_ID, name: "Priya Das", subject: "Primary", category: "PRT", busyPeriods: { ...periods(), 2: true, 4: true, 6: true } },
  { id: "t-09", schoolId: SCHOOL_ID, name: "Neha Joshi", subject: "Primary", category: "PRT", busyPeriods: { ...periods(), 1: true, 3: true, 5: true } },
  { id: "t-10", schoolId: SCHOOL_ID, name: "Arjun Malhotra", subject: "Physical Education", category: "TGT", busyPeriods: { ...periods(), 3: true, 5: true, 7: true } },
];

const readStore = (): PersistedStore => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as PersistedStore;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  return { teachers: seedTeachers, absences: [], schedules: [] };
};

const writeStore = (store: PersistedStore): void => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

const getStoredSchedule = (store: PersistedStore, date: string): Schedule | undefined =>
  store.schedules.find((schedule) => schedule.date === date);

export const timelyApi = {
  getSession: async (): Promise<SchoolSession> => { await wait(); return session; },
  getTeachers: async (): Promise<Teacher[]> => { await wait(); return readStore().teachers; },
  createTeacher: async (input: CreateTeacherInput): Promise<Teacher> => {
    await wait();
    const store = readStore();
    const teacher: Teacher = { id: `t-${crypto.randomUUID()}`, schoolId: SCHOOL_ID, ...input };
    store.teachers = [...store.teachers, teacher];
    writeStore(store);
    return teacher;
  },
  getAbsences: async (date: string): Promise<Absence[]> => {
    await wait();
    return readStore().absences.filter((absence) => absence.date === date);
  },
  createAbsence: async (input: CreateAbsenceInput): Promise<Absence> => {
    await wait();
    const store = readStore();
    const existing = store.absences.find((absence) => absence.date === input.date && absence.teacherId === input.teacherId);
    const absence: Absence = existing
      ? { ...existing, periods: [...new Set([...existing.periods, ...input.periods])].sort() as Period[], note: input.note || existing.note }
      : { id: `a-${crypto.randomUUID()}`, schoolId: SCHOOL_ID, createdAt: new Date().toISOString(), ...input };
    store.absences = existing ? store.absences.map((item) => item.id === existing.id ? absence : item) : [...store.absences, absence];
    store.schedules = store.schedules.filter((schedule) => schedule.date !== input.date);
    writeStore(store);
    return absence;
  },
  removeAbsence: async (absenceId: string): Promise<void> => {
    await wait();
    const store = readStore();
    const absence = store.absences.find((item) => item.id === absenceId);
    store.absences = store.absences.filter((item) => item.id !== absenceId);
    if (absence) store.schedules = store.schedules.filter((schedule) => schedule.date !== absence.date);
    writeStore(store);
  },
  generateSchedule: async (date: string): Promise<Schedule> => {
    await wait();
    const store = readStore();
    const schedule = generateCoverageSchedule({ schoolId: SCHOOL_ID, date, teachers: store.teachers, absences: store.absences.filter((absence) => absence.date === date), generatedBy: session.userName });
    store.schedules = [...store.schedules.filter((item) => item.date !== date), schedule];
    writeStore(store);
    return schedule;
  },
  getSchedule: async (date: string): Promise<Schedule> => {
    await wait();
    const store = readStore();
    const existing = getStoredSchedule(store, date);
    if (existing) return existing;

    return {
      id: `${SCHOOL_ID}-${date}`,
      schoolId: SCHOOL_ID,
      date,
      assignments: [],
      generatedAt: new Date().toISOString(),
      generatedBy: session.userName,
    };
  },
  getHistory: async (): Promise<Schedule[]> => { await wait(); return readStore().schedules.sort((first, second) => second.date.localeCompare(first.date)); },
  getStats: async (date: string): Promise<DashboardStats> => {
    await wait();
    const store = readStore();
    const absences = store.absences.filter((absence) => absence.date === date);
    const schedule = getStoredSchedule(store, date);
    return {
      totalTeachers: store.teachers.length,
      todayAbsences: absences.length,
      coverageRequired: absences.reduce((total, absence) => total + absence.periods.length, 0),
      unassignedCoverages: schedule?.assignments.filter((assignment) => assignment.status === "unassigned").length ?? 0,
    };
  },
};
