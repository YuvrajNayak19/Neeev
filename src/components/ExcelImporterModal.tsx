import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORIES,
  PERIODS,
  type Category,
  type Teacher,
  type TimetablePeriod,
} from "@/lib/substitution";
import { parseTimetableCell } from "@/lib/timetableParser";
import { inferTeacherCategoryFromClasses } from "@/lib/inferCategory";

type Props = {
  onImport: (teachers: Teacher[]) => void;
};

type ParsedTeacher = Teacher & { sourceRow: number };

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[/_-]+/g, " ")
    .replace(/\s+/g, " ");

const categoryFrom = (value: unknown): Category | null => {
  const category = String(value ?? "")
    .trim()
    .toUpperCase();
  return (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : null;
};

const availabilityValue = (value: unknown): boolean | null => {
  const normalized = normalize(value);
  if (["busy", "1", "yes", "true", "unavailable", "teaching"].includes(normalized)) return true;
  if (["free", "0", "no", "false", "available", ""].includes(normalized)) return false;
  return null;
};

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(normalize(header)));
}

function parseRows(rows: unknown[][]): ParsedTeacher[] {
  if (rows.length < 2) return [];
  const headers = (rows[0] ?? []).map((header) => String(header ?? ""));
  const nameIndex = findColumn(headers, ["teacher name", "teacher", "name"]);
  const subjectIndex = findColumn(headers, [
    "department subject",
    "department",
    "subject",
    "department / subject",
  ]);
  const categoryIndex = findColumn(headers, ["category", "teacher category"]);
  const classIndex = findColumn(headers, ["class section", "class", "section", "class / section"]);

  if (nameIndex < 0) return [];

  return rows.slice(1).flatMap((row, offset) => {
    const name = String(row[nameIndex] ?? "").trim();
    const subject = String((subjectIndex >= 0 ? row[subjectIndex] : "") ?? "").trim() || "General";
    const explicitCategory = categoryIndex >= 0 ? categoryFrom(row[categoryIndex]) : null;
    if (!name || !subject) return [];

    const busy: Record<number, boolean> = {};
    const timetable: Record<number, TimetablePeriod> = {};
    const weeklyTimetable: Record<number, Record<number, TimetablePeriod>> = {};
    const classSection =
      String((classIndex >= 0 ? row[classIndex] : "") ?? "").trim() || "Unassigned";
    const classesTaught = classSection === "Unassigned" ? [] : [classSection];
    PERIODS.forEach((period) => {
      const periodIndex = headers.findIndex((header) => {
        const normalized = normalize(header);
        return (
          normalized === `period ${period}` ||
          normalized === `p${period}` ||
          normalized === `periods ${period}` ||
          normalized.includes(`period ${period} availability`)
        );
      });
      const rawCell = periodIndex >= 0 ? String(row[periodIndex] ?? "") : "";
      const parsedDays = parseTimetableCell(rawCell);
      const hasDayEntry = parsedDays.some((day) => day.isBusy);
      const value = hasDayEntry ? parsedDays.some((day) => day.isBusy) : availabilityValue(rawCell);
      if (value !== null) {
        busy[period] = value;
        for (const day of parsedDays) {
          if (day.isBusy && day.classSection) classesTaught.push(day.classSection);
        }
        timetable[period] = {
          subject,
          classSection: parsedDays[0]?.classSection || classSection,
          isFree: !value,
        };
        weeklyTimetable[period] = Object.fromEntries(
          parsedDays.map((day) => [
            day.day,
            {
              subject,
              classSection: day.classSection || classSection,
              isFree: !day.isBusy,
            },
          ]),
        );
      }
    });

    return [
      {
        id: `imported-${Date.now()}-${offset}`,
        name,
        subject,
        category: explicitCategory ?? inferTeacherCategoryFromClasses(classesTaught),
        busy,
        timetable,
        weeklyTimetable,
        sourceRow: offset + 2,
      },
    ];
  });
}

export function ExcelImporterModal({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedTeacher[]>([]);
  const [error, setError] = useState("");

  const reset = () => {
    setFileName("");
    setParsed([]);
    setError("");
    setDragging(false);
  };

  const readFile = async (file: File) => {
    setError("");
    setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
      if (!firstSheet) throw new Error("The workbook does not contain a worksheet.");
      const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
        header: 1,
        defval: "",
        raw: false,
      });
      const teachers = parseRows(rows);
      if (teachers.length === 0) {
        throw new Error(
          "No valid rows found. Include Teacher Name, Department / Subject, Category, and Period 1–8 columns.",
        );
      }
      setParsed(teachers);
    } catch (cause) {
      setParsed([]);
      setError(cause instanceof Error ? cause.message : "Unable to parse this timetable.");
    }
  };

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("Choose an .xlsx, .xls, or .csv file.");
      return;
    }
    void readFile(file);
  };

  const confirmImport = () => {
    onImport(parsed.map(({ sourceRow: _sourceRow, ...teacher }) => teacher));
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload /> <span className="hidden sm:inline">Import Excel / CSV Timetable</span>
        <span className="sm:hidden">Import</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogContent className="glass-regular max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/15 p-5 text-primary shadow-2xl sm:max-w-4xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <FileSpreadsheet className="size-5 text-primary" />
              Import master timetable
            </DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with teacher, subject, category, and Period 1–8
              availability columns.
            </DialogDescription>
          </DialogHeader>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptFile(event.dataTransfer.files[0]);
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-primary bg-accent/70"
                : "border-primary/20 hover:border-primary hover:bg-accent/50"
            }`}
          >
            <Upload className="mx-auto size-8 text-primary" />
            <p className="mt-3 font-semibold text-primary">Drop your timetable here</p>
            <p className="mt-1 text-sm text-foreground/70">
              or click to browse .xlsx, .xls, or .csv files
            </p>
            {fileName && <p className="mt-3 text-sm font-medium text-primary">{fileName}</p>}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          {parsed.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-800">
                Parsed {parsed.length} valid teacher timetables ready to import
              </p>
              <div className="glass-regular overflow-x-auto rounded-xl border border-primary/15 backdrop-blur-[10px] backdrop-saturate-[180%]">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-accent/50 text-left text-xs uppercase tracking-wide text-foreground/70">
                    <tr>
                      <th className="px-3 py-2">Teacher</th>
                      <th className="px-3 py-2">Department / Subject</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Periods</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {parsed.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-3 py-2 font-medium">{teacher.name}</td>
                        <td className="px-3 py-2">{teacher.subject}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-primary">
                            {teacher.category}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="grid grid-cols-8 gap-1">
                            {PERIODS.map((period) => (
                              <span
                                key={period}
                                title={`P${period}: ${teacher.busy[period] ? "Busy" : "Free"}`}
                                data-availability={teacher.busy[period] ? "busy" : "free"}
                                className={`rounded px-1 py-1 text-center text-[10px] font-semibold ${
                                  teacher.busy[period]
                                    ? "bg-muted text-foreground/70"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                P{period}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <X /> Cancel
            </Button>
            <Button type="button" disabled={parsed.length === 0} onClick={confirmImport}>
              Confirm &amp; Import to Roster
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
