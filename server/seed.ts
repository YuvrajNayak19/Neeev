import "dotenv/config";

import { randomUUID } from "crypto";

const teachers = [
  { id: "t-1", name: "Ananya Sharma", qualification: "TGT", subjects: ["English", "Social"] },
  { id: "t-2", name: "Vikram Singh", qualification: "PGT", subjects: ["Maths", "Physics"] },
  { id: "t-3", name: "Neha Iyer", qualification: "TGT", subjects: ["Science", "Biology"] },
  { id: "t-4", name: "Arjun Rao", qualification: "PGT", subjects: ["Chemistry", "Science"] },
  { id: "t-5", name: "Meera Nair", qualification: "TGT", subjects: ["English", "Hindi"] },
  { id: "t-6", name: "Rohit Verma", qualification: "PGT", subjects: ["Computer", "Maths"] },
  { id: "t-7", name: "Kavya Das", qualification: "PRT", subjects: ["Art", "Library"] },
  { id: "t-8", name: "Pranav Menon", qualification: "PGT", subjects: ["Physics", "Maths"] },
  { id: "t-9", name: "Diya Kapoor", qualification: "TGT", subjects: ["Science", "English"] },
  { id: "t-10", name: "Ishaan Bose", qualification: "PGT", subjects: ["Biology", "Chemistry"] },
];

const classes = ["6-A", "6-B", "7-A", "7-B", "8-A", "8-B", "9-A", "9-B", "9-C", "10-A", "10-B", "10-C", "11-A", "11-B", "12-A", "12-B"];

const seed = {
  school: {
    name: "EduSync Academy",
    code: "EDUSYNC",
    academicYear: "2026-27",
  },
  teachers,
  classes,
  students: Array.from({ length: 400 }, (_, index) => ({
    id: randomUUID(),
    name: `Student ${index + 1}`,
    className: classes[index % classes.length],
    admissionNo: `A${String(index + 1).padStart(4, "0")}`,
  })),
};

console.log(JSON.stringify(seed, null, 2));
