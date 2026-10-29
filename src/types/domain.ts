export type TeacherCategory = "PRT" | "TGT" | "PGT";
export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PeriodMap = Record<Period, boolean>;
export type UserRole = "admin" | "student";

export interface TimetableSlot {
  subject: string;
  classSection: string;
  isFree: boolean;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  subject: string;
  category: TeacherCategory;
  busyPeriods: PeriodMap;
  timetable?: Partial<Record<Period, TimetableSlot>>;
}

export interface Absence {
  id: string;
  schoolId: string;
  teacherId: string;
  date: string;
  periods: Period[];
  note?: string;
  createdAt: string;
}

export type AssignmentStatus = "assigned" | "unassigned" | "pending";

export interface CoverageAssignment {
  id: string;
  absentTeacherId: string;
  absentTeacherName: string;
  classSubject: string;
  classSection: string;
  category: TeacherCategory;
  period: Period;
  coveringTeacherId?: string;
  coveringTeacherName?: string;
  status: AssignmentStatus;
  reason?: string;
}

export interface Schedule {
  id: string;
  schoolId: string;
  date: string;
  assignments: CoverageAssignment[];
  generatedAt: string;
  generatedBy: string;
}

export interface SchoolSession {
  schoolId: string;
  schoolName: string;
  userName: string;
  role: UserRole;
}

export interface DashboardStats {
  totalTeachers: number;
  todayAbsences: number;
  coverageRequired: number;
  unassignedCoverages: number;
}

export interface CreateTeacherInput {
  name: string;
  subject: string;
  category: TeacherCategory;
  busyPeriods: PeriodMap;
  timetable?: Partial<Record<Period, TimetableSlot>>;
}

export interface CreateAbsenceInput {
  teacherId: string;
  date: string;
  periods: Period[];
  note?: string;
}
