import type { ClassSection, MasterTimetable, SchoolAbsence, SchoolTeacher, Subject, TeacherAssignment } from "../types/school-domain";

export const demoSchoolId = "school-greenfield";

export const demoClassSections: ClassSection[] = [
  { id: "class-10-a", schoolId: demoSchoolId, className: "10", section: "A", classTeacherId: "teacher-kabir" },
  { id: "class-10-b", schoolId: demoSchoolId, className: "10", section: "B", classTeacherId: "teacher-meera" },
  { id: "class-9-a", schoolId: demoSchoolId, className: "9", section: "A", classTeacherId: "teacher-rohan" },
];

export const demoSubjects: Subject[] = [
  { id: "subject-science", schoolId: demoSchoolId, name: "Science", category: "TGT", weeklyPeriodsRequired: 6 },
  { id: "subject-mathematics", schoolId: demoSchoolId, name: "Mathematics", category: "TGT", weeklyPeriodsRequired: 6 },
  { id: "subject-english", schoolId: demoSchoolId, name: "English", category: "PGT", weeklyPeriodsRequired: 5 },
];

export const demoTeachers: SchoolTeacher[] = [
  { id: "teacher-kabir", schoolId: demoSchoolId, name: "Kabir Singh", email: "kabir@greenfield.edu", category: "TGT", primarySubjects: ["subject-science"] },
  { id: "teacher-meera", schoolId: demoSchoolId, name: "Meera Iyer", email: "meera@greenfield.edu", category: "TGT", primarySubjects: ["subject-mathematics"] },
  { id: "teacher-rohan", schoolId: demoSchoolId, name: "Rohan Verma", email: "rohan@greenfield.edu", category: "TGT", primarySubjects: ["subject-science"] },
  { id: "teacher-diya", schoolId: demoSchoolId, name: "Diya Kapoor", email: "diya@greenfield.edu", category: "PGT", primarySubjects: ["subject-english"] },
  { id: "teacher-vikram", schoolId: demoSchoolId, name: "Vikram Rao", email: "vikram@greenfield.edu", category: "PGT", primarySubjects: ["subject-science"] },
];

export const demoAssignments: TeacherAssignment[] = [
  { id: "assignment-1", schoolId: demoSchoolId, teacherId: "teacher-kabir", classSectionId: "class-10-a", subjectId: "subject-science", periodsPerWeek: 6 },
  { id: "assignment-2", schoolId: demoSchoolId, teacherId: "teacher-rohan", classSectionId: "class-9-a", subjectId: "subject-science", periodsPerWeek: 6 },
  { id: "assignment-3", schoolId: demoSchoolId, teacherId: "teacher-meera", classSectionId: "class-10-b", subjectId: "subject-mathematics", periodsPerWeek: 6 },
  { id: "assignment-4", schoolId: demoSchoolId, teacherId: "teacher-diya", classSectionId: "class-10-a", subjectId: "subject-english", periodsPerWeek: 5 },
];

export const demoMasterTimetable: MasterTimetable[] = [
  { id: "slot-1", schoolId: demoSchoolId, classSectionId: "class-10-a", dayOfWeek: 3, period: 1, subjectId: "subject-mathematics", assignedTeacherId: "teacher-meera", room: "A-101" },
  { id: "slot-2", schoolId: demoSchoolId, classSectionId: "class-10-a", dayOfWeek: 3, period: 2, subjectId: "subject-science", assignedTeacherId: "teacher-kabir", room: "Lab-1" },
  { id: "slot-3", schoolId: demoSchoolId, classSectionId: "class-10-a", dayOfWeek: 3, period: 3, subjectId: "subject-english", assignedTeacherId: "teacher-diya", room: "A-101" },
  { id: "slot-4", schoolId: demoSchoolId, classSectionId: "class-10-b", dayOfWeek: 3, period: 2, subjectId: "subject-science", assignedTeacherId: "teacher-rohan", room: "B-101" },
  { id: "slot-5", schoolId: demoSchoolId, classSectionId: "class-9-a", dayOfWeek: 3, period: 2, subjectId: "subject-science", assignedTeacherId: "teacher-rohan", room: "C-101" },
  { id: "slot-6", schoolId: demoSchoolId, classSectionId: "class-10-b", dayOfWeek: 3, period: 1, subjectId: "subject-english", assignedTeacherId: "teacher-diya", room: "B-101" },
];

export const demoAbsences: SchoolAbsence[] = [
  { id: "absence-1", schoolId: demoSchoolId, teacherId: "teacher-kabir", date: "2026-09-23", periods: [2], reason: "Medical leave" },
  { id: "absence-2", schoolId: demoSchoolId, teacherId: "teacher-meera", date: "2026-09-23", periods: [1], reason: "Approved leave" },
];
