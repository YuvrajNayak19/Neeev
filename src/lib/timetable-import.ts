import * as XLSX from "xlsx";
import { CATEGORIES, PERIODS, type Category, type Teacher } from "./substitution";
import { inferTeacherCategoryFromClasses } from "./inferCategory";
import { parseTimetableCell } from "./timetableParser";

export type ImportResult = {
  teachers: Teacher[];
  warnings: string[];
};

const FREE_TOKENS = new Set(["", "-", "--", "free", "f", "0", "no", "n", "na", "n/a", "off", "idle"]);

const norm = (v: unknown) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();

/** Which column index holds which period (1..8) */
function detectPeriodColumns(header: string[]): Record<number, number> {
  const map: Record<number, number> = {};
  header.forEach((raw, idx) => {
    const h = norm(raw).toLowerCase();
    if (!h) return;
    const m = h.match(/^(?:p|period|per|prd)?\s*[-_ ]?0?([1-8])$/);
    if (m) {
      const p = Number(m[1]);
      if (map[p] === undefined) map[p] = idx;
    }
  });
  return map;
}

function findColumn(header: string[], keys: string[]) {
  for (let i = 0; i < header.length; i++) {
    const h = norm(header[i]).toLowerCase();
    if (keys.some((k) => h === k || h.includes(k))) return i;
  }
  return -1;
}

/** Parse an xlsx / xls / csv / ods file into teachers with Free/Busy period slots. */
export async function parseTimetableFile(file: File): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("The file has no sheets.");
  const sheet = wb.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
  if (!rows.length) throw new Error("The first sheet is empty.");

  // Find the header row: the first row that exposes at least 3 period columns.
  let headerIdx = -1;
  let periodCols: Record<number, number> = {};
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const header = (rows[i] ?? []).map(norm);
    const cols = detectPeriodColumns(header);
    if (Object.keys(cols).length >= 3) {
      headerIdx = i;
      periodCols = cols;
      break;
    }
  }
  if (headerIdx === -1)
    throw new Error(
      "Could not find period columns. Use a header row with columns: Teacher, Subject, P1 … P8.",
    );

  const header = (rows[headerIdx] ?? []).map(norm);
  const nameCol = findColumn(header, ["teacher", "name", "faculty", "staff"]);
  const subjectCol = findColumn(header, ["subject", "department", "dept", "stream"]);
  const categoryCol = findColumn(header, ["category", "level", "cadre", "designation", "grade"]);
  if (nameCol === -1)
    throw new Error("Could not find a teacher name column. Add a header cell named 'Teacher'.");

  const warnings: string[] = [];
  const missing = PERIODS.filter((p) => periodCols[p] === undefined);
  if (missing.length) warnings.push(`No column found for period(s) ${missing.join(", ")} — treated as Free.`);

  const teachers: Teacher[] = [];
  const seen = new Set<string>();

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const name = norm(row[nameCol]);
    if (!name) continue;
    const lower = name.toLowerCase();
    if (lower === "teacher" || lower === "name") continue;
    if (seen.has(lower)) {
      warnings.push(`Duplicate row for "${name}" was skipped.`);
      continue;
    }
    seen.add(lower);

    const busy: Record<number, boolean> = {};
    const timetable: NonNullable<Teacher["timetable"]> = {};
    const weeklyTimetable: NonNullable<Teacher["weeklyTimetable"]> = {};
    const classesTaught: string[] = [];
    for (const p of PERIODS) {
      const col = periodCols[p];
      if (col === undefined) continue;
      const cell = norm(row[col]);
      const parsedDays = parseTimetableCell(cell);
      const hasDayEntry = parsedDays.some((day) => day.isBusy);
      const isFree = hasDayEntry
        ? parsedDays.every((day) => !day.isBusy)
        : FREE_TOKENS.has(cell.toLowerCase());
      if (!isFree) {
        busy[p] = true;
      }
      for (const day of parsedDays) {
        if (day.isBusy && day.classSection) classesTaught.push(day.classSection);
      }
      const classSection = parsedDays.find((day) => day.isBusy)?.classSection ?? "";
      timetable[p] = { subject: "", classSection, isFree };
      weeklyTimetable[p] = Object.fromEntries(
        parsedDays.map((day) => [
          day.day,
          { subject: "", classSection: day.classSection, isFree: !day.isBusy },
        ]),
      );
    }

    let subject = subjectCol === -1 ? "" : norm(row[subjectCol]);
    if (!subject) {
      subject = norm(row[findColumn(header, ["department", "dept", "stream"])]) || "General";
    }

    const rawCategory = categoryCol === -1 ? "" : norm(row[categoryCol]).toUpperCase();
    const category: Category =
      (CATEGORIES as readonly string[]).includes(rawCategory)
        ? (rawCategory as Category)
        : inferTeacherCategoryFromClasses(classesTaught);

    teachers.push({
      id: `imp${r}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      subject,
      category,
      busy,
      timetable: Object.fromEntries(
        PERIODS.map((period) => [
          period,
          { ...timetable[period], subject },
        ]),
      ) as NonNullable<Teacher["timetable"]>,
      weeklyTimetable: Object.fromEntries(
        PERIODS.map((period) => [
          period,
          Object.fromEntries(
            Object.entries(weeklyTimetable[period] ?? {}).map(([day, value]) => [
              day,
              { ...value, subject },
            ]),
          ),
        ]),
      ) as NonNullable<Teacher["weeklyTimetable"]>,
    });
  }

  if (!teachers.length) throw new Error("No teacher rows were found below the header.");
  return { teachers, warnings };
}

/** Merge imported teachers into an existing roster, matching by name. */
export function mergeTeachers(existing: Teacher[], imported: Teacher[]): Teacher[] {
  const byName = new Map(existing.map((t) => [t.name.trim().toLowerCase(), t]));
  const result = [...existing];
  for (const imp of imported) {
    const match = byName.get(imp.name.trim().toLowerCase());
    if (match) {
      const idx = result.findIndex((t) => t.id === match.id);
      if (idx === -1) continue;
      result[idx] = {
        ...match,
        subject: imp.subject || match.subject,
        category: imp.category || match.category,
        busy: imp.busy,
        ...(imp.timetable || match.timetable ? { timetable: imp.timetable || match.timetable } : {}),
        ...(imp.weeklyTimetable || match.weeklyTimetable
          ? { weeklyTimetable: imp.weeklyTimetable || match.weeklyTimetable }
          : {}),
      };
    } else {
      result.push(imp);
    }
  }
  return result;
}

export function downloadTimetableTemplate() {
  const header = ["Teacher", "Subject", "Category", ...PERIODS.map((p) => `P${p}`)];
  const rows = [
    ["Teacher name 1", "Mathematics", "PGT", "XII B 1-6", "XI A 1-3", "Free", "X B 2,4", "Free", "XII B+G 1-6", "Free", "Free"],
    ["Teacher name 2", "Physics", "TGT", "Free", "XI A 1-3", "XII B 2,5", "Free", "Free", "XI C 1-6", "Free", "Free"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timetable");
  XLSX.writeFile(wb, "timely-timetable-template.xlsx");
}
