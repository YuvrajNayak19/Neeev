import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import {
  ClassSection,
  MasterTimetable,
  School,
  Student,
  Subject,
  Teacher,
  TeacherAssignment,
  TimetableSlot,
  TimetableVersion,
  User,
} from "../models";

export const DEMO_SCHOOL_ID = "68f000000000000000000001";

const demoSchoolObjectId = new mongoose.Types.ObjectId(DEMO_SCHOOL_ID);
const periodTimes = [
  ["08:20", "09:00"],
  ["09:00", "09:40"],
  ["09:40", "10:20"],
  ["10:20", "11:00"],
  ["11:20", "12:00"],
  ["12:00", "12:40"],
  ["12:40", "13:20"],
  ["13:20", "14:00"],
] as const;
const week = [
  ["English", "Mathematics", "Science", "Hindi", "Social Science", "Mathematics", "Physical Education", "English"],
  ["Mathematics", "English", "Science", "Social Science", "Hindi", "Art", "Mathematics", "Physical Education"],
  ["English", "Science", "Mathematics", "Hindi", "Social Science", "Computer", "Physical Education", "Mathematics"],
  ["Hindi", "Mathematics", "Science", "English", "Social Science", "Art", "Physical Education", "Mathematics"],
  ["English", "Social Science", "Science", "Mathematics", "Hindi", "Physical Education", "Art", "English"],
  ["Mathematics", "English", "Science", "Social Science", "Hindi", "Computer", "Physical Education", "Mathematics"],
] as const;
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const teacherSeeds = [
  { name: "Vikram Singh", email: "teacher@edusync.school", qualificationCategory: "PGT", subjectCode: "MATH" },
  { name: "Riya Sen", email: "riya.sen@edusync.school", qualificationCategory: "TGT", subjectCode: "ENG" },
  { name: "Nisha Shah", email: "nisha.shah@edusync.school", qualificationCategory: "TGT", subjectCode: "SCI" },
  { name: "Aarav Mehta", email: "aarav.mehta@edusync.school", qualificationCategory: "TGT", subjectCode: "SOC" },
  { name: "Meera Nair", email: "meera.nair@edusync.school", qualificationCategory: "TGT", subjectCode: "HIN" },
  { name: "Rohit Verma", email: "rohit.verma@edusync.school", qualificationCategory: "PGT", subjectCode: "COM" },
  { name: "Kavya Das", email: "kavya.das@edusync.school", qualificationCategory: "TGT", subjectCode: "ART" },
  { name: "Kabir Joshi", email: "kabir.joshi@edusync.school", qualificationCategory: "TGT", subjectCode: "PE" },
] as const;

const subjectSeeds = [
  { code: "ENG", name: "English", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10, 11, 12], weeklyPeriods: 4 },
  { code: "MATH", name: "Mathematics", categoryRequired: "PGT", grades: [6, 7, 8, 9, 10, 11, 12], weeklyPeriods: 4 },
  { code: "SCI", name: "Science", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10], weeklyPeriods: 6, minPerDay: 1 },
  { code: "SOC", name: "Social Science", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10], weeklyPeriods: 4 },
  { code: "HIN", name: "Hindi", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10, 11, 12], weeklyPeriods: 4 },
  { code: "COM", name: "Computer", categoryRequired: "PGT", grades: [6, 7, 8, 9, 10, 11, 12], weeklyPeriods: 2, maxPerDay: 1, maxDaysPerWeek: 2 },
  { code: "ART", name: "Art", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10], weeklyPeriods: 2 },
  { code: "PE", name: "Physical Education", categoryRequired: "TGT", grades: [6, 7, 8, 9, 10, 11, 12], weeklyPeriods: 2 },
] as const;

export async function seedDemoData() {
  const school = await School.findOneAndUpdate(
    { _id: demoSchoolObjectId },
    {
      $set: {
        name: "Greenfield Public School",
        code: "EDUSYNC",
        academicYear: "2026-27",
        board: "CBSE",
        state: "Delhi",
        city: "New Delhi",
        email: "office@edusync.school",
        status: "ACTIVE",
        classRange: [6, 12],
        periodsPerDay: 8,
        timingSlots: periodTimes.map(([startTime, endTime], index) => ({
          periodNumber: index + 1,
          startTime,
          endTime,
          isBreak: false,
        })),
        settings: { workingDays: [1, 2, 3, 4, 5, 6], alternateSaturdayOff: false, mode: "FIXED", lunchAfterPeriod: 4 },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const [adminPasswordHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("teacher123", 10),
    bcrypt.hash("student123", 10),
  ]);
  const admin = await User.findOneAndUpdate(
    { schoolId: school._id, email: "admin@edusync.school" },
    {
      $set: {
        passwordHash: adminPasswordHash,
        role: "SCHOOL_ADMIN",
        status: "ACTIVE",
        profile: { name: "Ananya Sharma", phone: "" },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const demoTeacherUser = await User.findOneAndUpdate(
    { schoolId: school._id, email: "teacher@edusync.school" },
    {
      $set: {
        passwordHash: teacherHash,
        role: "TEACHER",
        status: "ACTIVE",
        profile: { name: "Vikram Singh", phone: "" },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const demoClass = await ClassSection.findOneAndUpdate(
    { schoolId: school._id, grade: 10, section: "A" },
    { $set: { roomNumber: "10-A", stream: null } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const studentUser = await User.findOneAndUpdate(
    { schoolId: school._id, admissionNumber: "A1042" },
    {
      $set: {
        passwordHash: studentHash,
        role: "STUDENT",
        status: "ACTIVE",
        profile: { name: "Aarohi Gupta", phone: "" },
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const subjects = new Map<string, mongoose.Types.ObjectId>();
  for (const data of subjectSeeds) {
    const subject = await Subject.findOneAndUpdate(
      { schoolId: school._id, code: data.code },
      {
        $set: {
          ...data,
          isElective: data.code === "COM" || data.code === "ART",
          maxPerDay: "maxPerDay" in data ? data.maxPerDay : 2,
          maxDaysPerWeek: "maxDaysPerWeek" in data ? data.maxDaysPerWeek : 6,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    subjects.set(data.code, subject._id);
  }

  const teachers = new Map<string, mongoose.Types.ObjectId>();
  for (const data of teacherSeeds) {
    const primarySubject = subjects.get(data.subjectCode);
    if (!primarySubject) throw new Error(`Missing demo subject ${data.subjectCode}.`);
    const teacher = await Teacher.findOneAndUpdate(
      { schoolId: school._id, email: data.email },
      {
        $set: {
          name: data.name,
          email: data.email,
          qualificationCategory: data.qualificationCategory,
          primarySubjects: [primarySubject],
          maxPeriodsPerDay: 6,
          maxPeriodsPerWeek: 30,
          userId: data.email === "teacher@edusync.school" ? demoTeacherUser._id : null,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    teachers.set(data.name, teacher._id);
  }

  await Promise.all(
    Array.from({ length: 7 }, (_, index) => index + 6).flatMap((grade) =>
      ["A", "B"].map(async (section) => {
        const classTeacher = grade < 11 ? teachers.get("Riya Sen") : teachers.get("Vikram Singh");
        await ClassSection.findOneAndUpdate(
          { schoolId: school._id, grade, section },
          {
            $set: {
              roomNumber: `${grade}-${section}`,
              stream: grade >= 11 ? (section === "A" ? "Science" : "Commerce") : null,
              classTeacherId: classTeacher,
            },
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
      }),
    ),
  );

  await Student.findOneAndUpdate(
    { schoolId: school._id, admissionNumber: "A1042" },
    {
      $set: {
        userId: studentUser._id,
        classSectionId: demoClass._id,
        name: "Aarohi Gupta",
        admissionNumber: "A1042",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const subjectByName = new Map<string, mongoose.Types.ObjectId>();
  const teacherBySubject = new Map<string, mongoose.Types.ObjectId>();
  for (const subject of subjectSeeds) {
    const subjectId = subjects.get(subject.code);
    const teacherSeed = teacherSeeds.find((teacher) => teacher.subjectCode === subject.code);
    const teacherId = teacherSeed ? teachers.get(teacherSeed.name) : undefined;
    if (!subjectId || !teacherId) throw new Error(`Missing demo teacher or subject for ${subject.name}.`);
    subjectByName.set(subject.name, subjectId);
    teacherBySubject.set(subject.name, teacherId);
  }
  const periodCounts = new Map<string, number>();
  for (const day of week) for (const subjectName of day) periodCounts.set(subjectName, (periodCounts.get(subjectName) ?? 0) + 1);
  for (const [subjectName, subjectId] of subjectByName) {
    await TeacherAssignment.findOneAndUpdate(
      { schoolId: school._id, classSectionId: demoClass._id, subjectId },
      {
        $set: {
          teacherId: teacherBySubject.get(subjectName),
          weeklyPeriodsNeeded: periodCounts.get(subjectName) ?? 4,
          isForced: false,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const version = await TimetableVersion.findOneAndUpdate(
    { schoolId: school._id, versionNumber: 1 },
    { $set: { status: "PUBLISHED", source: "GENERATED", createdBy: admin._id, publishedAt: new Date() } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  for (let dayIndex = 0; dayIndex < week.length; dayIndex += 1) {
    for (let periodIndex = 0; periodIndex < week[dayIndex].length; periodIndex += 1) {
      const subjectName = week[dayIndex][periodIndex];
      const subjectId = subjectByName.get(subjectName);
      const teacherId = teacherBySubject.get(subjectName);
      if (!subjectId || !teacherId) throw new Error(`Missing demo assignment for ${subjectName}.`);
      const periodNumber = periodIndex + 1;
      const shared = {
        schoolId: school._id,
        versionId: version._id,
        classSectionId: demoClass._id,
        dayOfWeek: weekDays[dayIndex],
        periodNumber,
        subjectId,
        teacherId,
      };
      await TimetableSlot.findOneAndUpdate(
        { schoolId: school._id, versionId: version._id, classSectionId: demoClass._id, dayOfWeek: weekDays[dayIndex], periodNumber },
        { $set: { ...shared, isLocked: false, isForced: false, warning: "", room: "10-A" } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      await MasterTimetable.findOneAndUpdate(
        { schoolId: school._id, classSectionId: demoClass._id, dayOfWeek: weekDays[dayIndex], periodNumber },
        { $set: { ...shared, isLocked: false, isForced: false, isElectiveGroup: false, electiveGroupId: null } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    }
  }

  return { school, admin, demoTeacherUser, studentUser, classSection: demoClass };
}
