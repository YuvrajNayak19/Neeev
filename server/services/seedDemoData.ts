import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import {
  Absence,
  ClassSection,
  Complaint,
  DailySubstitution,
  MasterTimetable,
  Notice,
  Notification,
  RequestModel,
  School,
  Student,
  Subject,
  Teacher,
  TeacherAssignment,
  TimetableSlot,
  TimetableVersion,
  User,
} from "../models";
import { PERIOD_SLOTS } from "../config/schedule";
import { runSubstitutionDraft } from "./substitutionEngine";

/**
 * Demo school for the ClassSync showcase: Greenfield Public School, New Delhi.
 * Every run wipes and rebuilds this one school (other schools are untouched), so the
 * demo always opens on a realistic "today": three teachers absent, cover partly arranged,
 * requests waiting, notices posted.
 */
export const DEMO_SCHOOL_ID = "68f000000000000000000001";
const schoolObjectId = new mongoose.Types.ObjectId(DEMO_SCHOOL_ID);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
type Day = (typeof DAYS)[number];

const SUBJECTS = [
  { code: "ENG", name: "English", weekly: 7, maxPerDay: 2 },
  { code: "MATH", name: "Mathematics", weekly: 8, maxPerDay: 2 },
  { code: "SCI", name: "Science", weekly: 8, maxPerDay: 2 },
  { code: "HIN", name: "Hindi", weekly: 6, maxPerDay: 2 },
  { code: "SOC", name: "Social Science", weekly: 7, maxPerDay: 2 },
  { code: "COM", name: "Computer", weekly: 4, maxPerDay: 1 },
  { code: "ART", name: "Art", weekly: 4, maxPerDay: 1 },
  { code: "PE", name: "Physical Education", weekly: 4, maxPerDay: 1 },
] as const;
type SubjectCode = (typeof SUBJECTS)[number]["code"];

const TEACHERS: Array<{ name: string; subject: SubjectCode; category: "TGT" | "PGT"; phone: string; email?: string }> = [
  { name: "Vikram Singh", subject: "MATH", category: "PGT", phone: "9810012345", email: "teacher@classsync.school" },
  { name: "Kavita Iyer", subject: "MATH", category: "TGT", phone: "9810023456" },
  { name: "Arjun Rao", subject: "MATH", category: "TGT", phone: "9810034567" },
  { name: "Sanjay Kulkarni", subject: "MATH", category: "PGT", phone: "9810045678" },
  { name: "Fatima Khan", subject: "ENG", category: "TGT", phone: "9810056789" },
  { name: "Neha Kapoor", subject: "ENG", category: "TGT", phone: "9810067890" },
  { name: "Riya Sen", subject: "ENG", category: "TGT", phone: "9810078901" },
  { name: "Thomas Mathew", subject: "ENG", category: "PGT", phone: "9810089012" },
  { name: "Priya Menon", subject: "SCI", category: "TGT", phone: "9810090123" },
  { name: "Rahul Bhatt", subject: "SCI", category: "PGT", phone: "9811001234" },
  { name: "Nisha Shah", subject: "SCI", category: "TGT", phone: "9811012345" },
  { name: "Joseph D'Souza", subject: "SCI", category: "TGT", phone: "9811023456" },
  { name: "Sunita Verma", subject: "HIN", category: "TGT", phone: "9811034567" },
  { name: "Meera Tiwari", subject: "HIN", category: "TGT", phone: "9811045678" },
  { name: "Alok Pandey", subject: "HIN", category: "TGT", phone: "9811056789" },
  { name: "Deepak Chauhan", subject: "SOC", category: "TGT", phone: "9811067890" },
  { name: "Aarav Mehta", subject: "SOC", category: "TGT", phone: "9811078901" },
  { name: "Lakshmi Reddy", subject: "SOC", category: "PGT", phone: "9811089012" },
  { name: "Imran Qureshi", subject: "COM", category: "PGT", phone: "9811090123" },
  { name: "Rohit Verma", subject: "COM", category: "TGT", phone: "9812001234" },
  { name: "Ananya Das", subject: "ART", category: "TGT", phone: "9812012345" },
  { name: "Kavya Joshi", subject: "ART", category: "TGT", phone: "9812023456" },
  { name: "Harpreet Gill", subject: "PE", category: "TGT", phone: "9812034567" },
  { name: "Kabir Thapa", subject: "PE", category: "TGT", phone: "9812045678" },
];

const CLASSES = ["6-A", "6-B", "7-A", "7-B", "8-A", "8-B", "9-A", "9-B", "10-A", "10-B"] as const;

const STUDENTS: Record<string, string[]> = {
  "6-A": ["Ishaan Malhotra", "Diya Choudhary", "Vihaan Sinha"],
  "6-B": ["Anika Bose", "Reyansh Goyal", "Myra Saxena"],
  "7-A": ["Advait Kulkarni", "Saanvi Arora", "Kabir Bhalla"],
  "7-B": ["Pari Jain", "Arnav Mishra", "Kiara Dutta"],
  "8-A": ["Aarohi Gupta", "Vivaan Nanda", "Tara Pillai", "Aditya Rawat"],
  "8-B": ["Navya Bansal", "Ayaan Siddiqui", "Riya Thakur"],
  "9-A": ["Krish Agarwal", "Meher Grewal", "Shaurya Yadav"],
  "9-B": ["Zara Hussain", "Atharv Deshpande", "Ira Chatterjee"],
  "10-A": ["Rohan Kapoor", "Ananya Iyer", "Siddharth Rana"],
  "10-B": ["Mahika Sood", "Yash Patil", "Sara Fernandes"],
};
const PENDING_STUDENTS = [
  { name: "Arjun Khanna", className: "7-A", admission: "A2210" },
  { name: "Nitya Raman", className: "9-B", admission: "A2211" },
  { name: "Dev Prakash", className: "6-B", admission: "A2212" },
];

/** Small deterministic PRNG so every seed produces the same timetable. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = { subject: SubjectCode; teacher: number };

/**
 * Builds a clash-free week for all classes: no teacher in two rooms at once,
 * at most 6 periods per teacher per day, per-subject daily limits respected.
 */
function buildWeek(): Cell[][][] {
  const teachersBySubject = new Map<SubjectCode, number[]>();
  TEACHERS.forEach((teacher, index) => teachersBySubject.set(teacher.subject, [...(teachersBySubject.get(teacher.subject) ?? []), index]));

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const random = mulberry32(2026 + attempt);
    const remaining = CLASSES.map(() => new Map<SubjectCode, number>(SUBJECTS.map((subject) => [subject.code, subject.weekly])));
    const grid: Cell[][][] = CLASSES.map(() => DAYS.map(() => []));
    let failed = false;

    for (let day = 0; day < DAYS.length && !failed; day += 1) {
      const dayLoad = new Map<number, number>();
      const dayCount = CLASSES.map(() => new Map<SubjectCode, number>());
      for (let period = 0; period < PERIOD_SLOTS.length && !failed; period += 1) {
        const busy = new Set<number>();
        const order = CLASSES.map((_, index) => index).sort(() => random() - 0.5);
        for (const classIndex of order) {
          const slotsLeft = (DAYS.length - day) * PERIOD_SLOTS.length - period;
          const previous = grid[classIndex][day][period - 1]?.subject;
          const options = SUBJECTS.filter((subject) => {
            const left = remaining[classIndex].get(subject.code) ?? 0;
            if (left <= 0 || (dayCount[classIndex].get(subject.code) ?? 0) >= subject.maxPerDay) return false;
            if (subject.code === "PE" && period === 0) return false;
            return (teachersBySubject.get(subject.code) ?? []).some((teacher) => !busy.has(teacher) && (dayLoad.get(teacher) ?? 0) < 6);
          }).map((subject) => {
            const left = remaining[classIndex].get(subject.code) ?? 0;
            const urgency = left / slotsLeft;
            const repeatPenalty = previous === subject.code ? 0.6 : 1;
            return { subject, score: (urgency * 10 + random() * 0.8) * repeatPenalty };
          }).sort((a, b) => b.score - a.score);
          const chosen = options[0]?.subject;
          if (!chosen) { failed = true; break; }
          const pool = teachersBySubject.get(chosen.code) ?? [];
          const home = pool[classIndex % pool.length];
          const free = pool.filter((teacher) => !busy.has(teacher) && (dayLoad.get(teacher) ?? 0) < 6);
          const teacher = free.includes(home) ? home : free.sort((a, b) => (dayLoad.get(a) ?? 0) - (dayLoad.get(b) ?? 0))[0];
          busy.add(teacher);
          dayLoad.set(teacher, (dayLoad.get(teacher) ?? 0) + 1);
          dayCount[classIndex].set(chosen.code, (dayCount[classIndex].get(chosen.code) ?? 0) + 1);
          remaining[classIndex].set(chosen.code, (remaining[classIndex].get(chosen.code) ?? 0) - 1);
          grid[classIndex][day][period] = { subject: chosen.code, teacher };
        }
      }
    }
    if (!failed) return grid;
  }
  throw new Error("Could not build the demo timetable.");
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today, or the following Monday when today is Sunday (no school). */
function schoolDate(offsetDays = 0) {
  const date = new Date();
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  date.setDate(date.getDate() + offsetDays);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date;
}

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@classsync.school`;
}

function roomFor(code: SubjectCode, className: string, period: number) {
  if (code === "COM") return "Computer Lab";
  if (code === "PE") return "Playground";
  if (code === "ART") return "Art Room";
  if (code === "SCI" && period % 3 === 0) return "Science Lab";
  return className;
}

export async function seedDemoData() {
  const schoolId = schoolObjectId;
  const school = await School.findOneAndUpdate(
    { _id: schoolId },
    {
      $set: {
        name: "Greenfield Public School",
        code: "GRNFLD",
        academicYear: "2026-27",
        board: "CBSE",
        state: "Delhi",
        city: "New Delhi",
        email: "office@classsync.school",
        phone: "011 4567 8900",
        status: "ACTIVE",
        classRange: [6, 10],
        periodsPerDay: PERIOD_SLOTS.length,
        timingSlots: PERIOD_SLOTS.map((slot) => ({ periodNumber: slot.number, startTime: slot.start, endTime: slot.end, isBreak: false })),
        settings: { workingDays: [1, 2, 3, 4, 5, 6], alternateSaturdayOff: false, mode: "FIXED", lunchAfterPeriod: 4 },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  // Start from a clean slate for the demo school only.
  await Promise.all([
    User.deleteMany({ schoolId }), Teacher.deleteMany({ schoolId }), Student.deleteMany({ schoolId }), Subject.deleteMany({ schoolId }),
    ClassSection.deleteMany({ schoolId }), TeacherAssignment.deleteMany({ schoolId }), TimetableSlot.deleteMany({ schoolId }),
    TimetableVersion.deleteMany({ schoolId }), MasterTimetable.deleteMany({ schoolId }), Absence.deleteMany({ schoolId }),
    DailySubstitution.deleteMany({ schoolId }), RequestModel.deleteMany({ schoolId }), Notice.deleteMany({ schoolId }),
    Complaint.deleteMany({ schoolId }), Notification.deleteMany({ schoolId }),
  ]);

  const [adminHash, teacherHash, studentHash] = await Promise.all([bcrypt.hash("admin123", 10), bcrypt.hash("teacher123", 10), bcrypt.hash("student123", 10)]);

  const admin = await User.create({ schoolId, email: "admin@classsync.school", passwordHash: adminHash, role: "SCHOOL_ADMIN", status: "ACTIVE", profile: { name: "Ananya Sharma", phone: "9876543210" } });

  const subjects = await Subject.insertMany(SUBJECTS.map((subject) => ({
    schoolId, code: subject.code, name: subject.name, categoryRequired: "TGT", grades: [6, 7, 8, 9, 10], weeklyPeriods: subject.weekly,
    maxPerDay: subject.maxPerDay, isElective: false, minPerDay: 0, maxDaysPerWeek: 6, priority: 3,
  })));
  const subjectId = new Map(subjects.map((subject) => [subject.code as SubjectCode, subject._id]));

  const teacherUsers = await User.insertMany(TEACHERS.map((teacher) => ({
    schoolId, email: teacher.email ?? emailFor(teacher.name), passwordHash: teacherHash, role: "TEACHER", status: "ACTIVE",
    profile: { name: teacher.name, phone: teacher.phone },
  })));
  const teachers = await Teacher.insertMany(TEACHERS.map((teacher, index) => ({
    schoolId, userId: teacherUsers[index]._id, name: teacher.name, email: teacherUsers[index].email, qualificationCategory: teacher.category,
    primarySubjects: [subjectId.get(teacher.subject)], maxPeriodsPerDay: 6, maxPeriodsPerWeek: 30,
  })));
  const teacherIndex = (name: string) => TEACHERS.findIndex((teacher) => teacher.name === name);

  // A pending teacher sign-up waiting for approval.
  await User.create({ schoolId, email: "pooja.saxena@classsync.school", passwordHash: teacherHash, role: "TEACHER", status: "PENDING", profile: { name: "Pooja Saxena", phone: "9812056789" } });

  const classDocs = await ClassSection.insertMany(CLASSES.map((label, index) => {
    const [grade, section] = label.split("-");
    return { schoolId, grade: Number(grade), section, roomNumber: label, stream: null, classTeacherId: teachers[(index * 5) % teachers.length]._id };
  }));
  const classId = new Map(CLASSES.map((label, index) => [label, classDocs[index]._id]));

  // Timetable
  const week = buildWeek();
  const version = await TimetableVersion.create({ schoolId, versionNumber: 1, status: "PUBLISHED", source: "GENERATED", createdBy: admin._id, publishedAt: new Date() });
  const slots = [];
  for (let classIndex = 0; classIndex < CLASSES.length; classIndex += 1) {
    for (let day = 0; day < DAYS.length; day += 1) {
      for (let period = 0; period < PERIOD_SLOTS.length; period += 1) {
        const cell = week[classIndex][day][period];
        slots.push({
          schoolId, versionId: version._id, classSectionId: classDocs[classIndex]._id, dayOfWeek: DAYS[day] as Day, periodNumber: period + 1,
          subjectId: subjectId.get(cell.subject), teacherId: teachers[cell.teacher]._id, room: roomFor(cell.subject, CLASSES[classIndex], period + 1),
        });
      }
    }
  }
  await TimetableSlot.insertMany(slots);

  // Home teacher per class and subject (used for "already knows this class").
  const assignments = [];
  for (let classIndex = 0; classIndex < CLASSES.length; classIndex += 1) {
    for (const subject of SUBJECTS) {
      const counts = new Map<number, number>();
      week[classIndex].flat().filter((cell) => cell.subject === subject.code).forEach((cell) => counts.set(cell.teacher, (counts.get(cell.teacher) ?? 0) + 1));
      const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (main !== undefined) assignments.push({ schoolId, classSectionId: classDocs[classIndex]._id, subjectId: subjectId.get(subject.code), teacherId: teachers[main]._id, weeklyPeriodsNeeded: subject.weekly });
    }
  }
  await TeacherAssignment.insertMany(assignments);

  // Students
  const studentUsers: Array<{ userId: mongoose.Types.ObjectId; name: string; className: string; admission: string; status: string }> = [];
  let admissionCounter = 1001;
  for (const [className, names] of Object.entries(STUDENTS)) {
    for (const name of names) {
      const admission = name === "Aarohi Gupta" ? "A1042" : `A${admissionCounter++}`;
      studentUsers.push({ userId: new mongoose.Types.ObjectId(), name, className, admission, status: "ACTIVE" });
    }
  }
  PENDING_STUDENTS.forEach((student) => studentUsers.push({ userId: new mongoose.Types.ObjectId(), name: student.name, className: student.className, admission: student.admission, status: "PENDING" }));
  await User.insertMany(studentUsers.map((student) => ({ _id: student.userId, schoolId, admissionNumber: student.admission, passwordHash: studentHash, role: "STUDENT", status: student.status, profile: { name: student.name } })));
  const studentDocs = await Student.insertMany(studentUsers.map((student) => ({ schoolId, userId: student.userId, classSectionId: classId.get(student.className as (typeof CLASSES)[number]), name: student.name, admissionNumber: student.admission })));
  const studentByName = new Map(studentUsers.map((student, index) => [student.name, studentDocs[index]]));

  // Today: three absences, cover partly arranged.
  const today = isoDate(schoolDate());
  const todayName = DAYS[schoolDate().getDay() - 1];
  await Absence.insertMany([
    { schoolId, teacherId: teachers[teacherIndex("Kavita Iyer")]._id, date: today, isFullDay: true, affectedPeriods: [], reason: "Fever" },
    { schoolId, teacherId: teachers[teacherIndex("Rahul Bhatt")]._id, date: today, isFullDay: false, affectedPeriods: [1, 2, 3, 4], reason: "CBSE board meeting" },
    { schoolId, teacherId: teachers[teacherIndex("Sunita Verma")]._id, date: today, isFullDay: true, affectedPeriods: [], reason: "Family function" },
  ]);
  await runSubstitutionDraft(String(schoolId), today, true);

  const rows = await DailySubstitution.find({ schoolId, date: today }).sort({ periodNumber: 1 }).lean();
  const demoTeacher = teachers[teacherIndex("Vikram Singh")];
  const daySlots = slots.filter((slot) => slot.dayOfWeek === todayName);
  const demoTeacherBusy = new Set(daySlots.filter((slot) => String(slot.teacherId) === String(demoTeacher._id)).map((slot) => slot.periodNumber));
  const mathsId = String(subjectId.get("MATH"));
  const demoDuty = rows.find((row) => String(row.subjectId) === mathsId && !demoTeacherBusy.has(row.periodNumber) && !rows.some((other) => other.periodNumber === row.periodNumber && String(other.substituteTeacherId) === String(demoTeacher._id)));

  for (const [index, row] of rows.entries()) {
    if (demoDuty && String(row._id) === String(demoDuty._id)) {
      await DailySubstitution.updateOne({ _id: row._id }, { $set: { substituteTeacherId: demoTeacher._id, status: "PUBLISHED", reason: "Same subject, free this period" } });
    } else if (index === rows.length - 1 || index === Math.floor(rows.length / 2)) {
      await DailySubstitution.updateOne({ _id: row._id }, { $set: { substituteTeacherId: null, status: "DRAFT", reason: "Waiting for a substitute" } });
    } else if (index % 3 === 2) {
      // Leave as a suggestion awaiting the admin's confirmation.
    } else if (row.substituteTeacherId) {
      await DailySubstitution.updateOne({ _id: row._id }, { $set: { status: "PUBLISHED" } });
    }
  }

  // Requests from teachers
  const userOf = (name: string) => teacherUsers[teacherIndex(name)]._id;
  const inDays = (days: number) => isoDate(schoolDate(days));
  await RequestModel.insertMany([
    { schoolId, requesterId: userOf("Neha Kapoor"), type: "PERIOD_SWAP", date: inDays(2), status: "PENDING_ADMIN", payload: { classSectionId: classId.get("9-B"), periodNumber: 3, otherPeriodNumber: 6, reason: "Parent–teacher meeting with a 9-B family at 10 am." }, impact: ["Requested change is pending review."] },
    { schoolId, requesterId: userOf("Deepak Chauhan"), type: "LEAVE_NOTICE", date: inDays(6), status: "PENDING_ADMIN", payload: { reason: "Cousin's wedding in Lucknow." }, impact: ["Leave notice sent."] },
    { schoolId, requesterId: userOf("Vikram Singh"), type: "EXTRA_PERIOD", date: inDays(1), status: "PENDING_ADMIN", payload: { classSectionId: classId.get("10-A"), subjectId: subjectId.get("MATH"), periodNumber: 8, reason: "Revision before the unit test on quadratic equations." }, impact: ["Requested change is pending review."] },
    { schoolId, requesterId: userOf("Priya Menon"), type: "CONSECUTIVE_PERIODS", date: inDays(3), status: "PENDING_ADMIN", payload: { classSectionId: classId.get("8-A"), subjectId: subjectId.get("SCI"), periodNumber: 5, reason: "Double period for the acids and bases lab activity." }, impact: ["Requested change is pending review."] },
    { schoolId, requesterId: userOf("Fatima Khan"), type: "LEAVE_NOTICE", date: inDays(1), status: "APPROVED", payload: { reason: "Doctor's appointment in the morning." }, impact: ["Leave notice sent."], decisionNote: "Approved. Please share lesson notes with the office.", decidedBy: admin._id },
    { schoolId, requesterId: userOf("Imran Qureshi"), type: "COMBINED_CLASS", date: inDays(2), status: "REJECTED", payload: { classSectionId: classId.get("7-A"), otherClassSectionId: classId.get("7-B"), periodNumber: 4, reason: "Combine both sections for the coding quiz." }, impact: ["Requested change is pending review."], decisionNote: "The Computer Lab only seats one section. Let's do it on Saturday instead.", decidedBy: admin._id },
  ]);

  await Notice.insertMany([
    { schoolId, title: "Assembly moves to the main hall on Friday", body: "Because of the rain forecast, Friday's assembly will be held in the main hall at 8:00 am.", audience: "ALL", createdBy: admin._id },
    { schoolId, title: "Pre-board timetable for classes 9 and 10 is published", body: "Class teachers, please share the schedule with students and parents this week.", audience: "STAFF", createdBy: admin._id, createdAt: new Date(Date.now() - 26 * 3600_000) },
    { schoolId, title: "Bring your library books back by Monday", body: "The library is closing for stock-taking from Tuesday to Thursday.", audience: "STUDENTS", createdBy: admin._id, createdAt: new Date(Date.now() - 50 * 3600_000) },
  ]);

  const complaint = (name: string, data: Record<string, unknown>) => {
    const student = studentByName.get(name)!;
    return { schoolId, studentId: student._id, classSectionId: student.classSectionId, serious: false, anonymous: false, ...data };
  };
  await Complaint.insertMany([
    complaint("Pari Jain", { category: "FACILITIES", place: "Classroom 7-B", message: "The second fan in our classroom has not worked for three days. It gets very hot after lunch.", status: "OPEN" }),
    complaint("Krish Agarwal", { category: "TIMETABLE", place: "", message: "We have Maths in period 7 and 8 on Friday and then no Maths on Saturday. Could one period move?", status: "OPEN" }),
    complaint("Navya Bansal", { category: "HYGIENE", place: "Second floor washroom", message: "There is no soap in the girls' washroom on the second floor.", status: "SEEN", resolutionNote: "Housekeeping informed." }),
    complaint("Aarohi Gupta", { category: "ACADEMICS", place: "", message: "Can we get the Science lab worksheet in advance so we can prepare?", status: "RESOLVED", resolutionNote: "Ms. Menon will share worksheets on Mondays." }),
    { ...complaint("Vivaan Nanda", { category: "BULLYING", message: "Some seniors take our seats in the bus every day and push us.", status: "OPEN" }), serious: true, anonymous: true, studentId: null },
  ]);

  const notifications = [
    { schoolId, userId: admin._id, type: "REQUEST", title: "New request", message: "Neha Kapoor asked to swap periods 3 and 6 for 9-B.", link: "/admin/requests" },
    { schoolId, userId: admin._id, type: "COVERAGE", title: "Cover needed", message: "Some periods today still need a substitute.", link: "/admin/substitutions" },
    { schoolId, userId: admin._id, type: "APPROVAL", title: "Sign-ups waiting", message: "4 new accounts are waiting for approval.", link: "/admin/accounts" },
  ];
  if (demoDuty) notifications.push({ schoolId, userId: demoTeacher.userId!, type: "SUBSTITUTION", title: "Cover duty today", message: `You are covering period ${demoDuty.periodNumber} today.`, link: "/teacher/dashboard" });
  notifications.push({ schoolId, userId: userOf("Vikram Singh"), type: "NOTICE", title: "New notice", message: "Pre-board timetable for classes 9 and 10 is published.", link: "/teacher/dashboard" });
  await Notification.insertMany(notifications);

  return { school, admin, classSection: classDocs[4] };
}
