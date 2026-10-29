export const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6] as const;
export type SchoolDay = (typeof SCHOOL_DAYS)[number];

export const SCHOOL_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type SchoolPeriod = (typeof SCHOOL_PERIODS)[number];

export const TEACHER_CATEGORIES = ["PRT", "TGT", "PGT"] as const;
export type TeacherCategory = (typeof TEACHER_CATEGORIES)[number];

export const USER_ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface School {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  periodsPerDay: number;
}

export interface ClassSection {
  id: string;
  schoolId: string;
  className: string;
  section: string;
  classTeacherId?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  category: TeacherCategory;
  weeklyPeriodsRequired: number;
}

export interface SchoolTeacher {
  id: string;
  schoolId: string;
  userId?: string;
  name: string;
  email: string;
  category: TeacherCategory;
  primarySubjects: string[];
}

export interface TeacherAssignment {
  id: string;
  schoolId: string;
  teacherId: string;
  classSectionId: string;
  subjectId: string;
  periodsPerWeek: number;
}

export interface MasterTimetable {
  id: string;
  schoolId: string;
  classSectionId: string;
  dayOfWeek: SchoolDay;
  period: SchoolPeriod;
  subjectId?: string;
  assignedTeacherId?: string;
  room?: string;
}

export interface SchoolAbsence {
  id: string;
  schoolId: string;
  teacherId: string;
  date: string;
  periods: SchoolPeriod[];
  reason?: string;
}

export type DailySubstitutionStatus = "assigned" | "unassigned";

export interface DailySubstitution {
  id: string;
  schoolId: string;
  date: string;
  period: SchoolPeriod;
  classSectionId: string;
  subjectId?: string;
  regularTeacherId: string;
  substituteTeacherId?: string;
  status: DailySubstitutionStatus;
  matchReason: string;
}

export interface SchoolUser {
  id: string;
  schoolId?: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface TimetableCellView {
  classSection: ClassSection;
  dayOfWeek: SchoolDay;
  period: SchoolPeriod;
  subject?: Subject;
  teacher?: SchoolTeacher;
  room?: string;
  substitution?: DailySubstitution;
}

export interface SmartSubstitutionInput {
  schoolId: string;
  date: string;
  teachers: SchoolTeacher[];
  subjects: Subject[];
  classSections: ClassSection[];
  assignments: TeacherAssignment[];
  masterTimetable: MasterTimetable[];
  absences: SchoolAbsence[];
}

export interface SmartSubstitutionResult {
  date: string;
  schoolId: string;
  substitutions: DailySubstitution[];
  generatedAt: string;
}
