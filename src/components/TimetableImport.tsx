import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Teacher } from "@/lib/substitution";
import {
  downloadTimetableTemplate,
  mergeTeachers,
  parseTimetableFile,
} from "@/lib/timetable-import";

type Props = {
  teachers: Teacher[];
  onChange: (teachers: Teacher[]) => void;
};

export function TimetableImport({ teachers, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsed, setParsed] = useState<Teacher[] | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setError(null);
    setWarnings([]);
    setParsed(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setWarnings([]);
    setParsed(null);
    setFileName(file.name);
    try {
      const res = await parseTimetableFile(file);
      setParsed(res.teachers);
      setWarnings(res.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  const apply = (mode: "replace" | "merge") => {
    if (!parsed) return;
    onChange(mode === "replace" ? parsed : mergeTeachers(teachers, parsed));
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <Upload /> <span className="hidden sm:inline">Import timetable</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import timetable</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls), OpenDocument (.ods) or CSV file exported from any
            spreadsheet app. Free / Busy slots are filled in automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-muted-foreground">
            <p className="font-medium text-foreground">Expected layout</p>
            <p className="mt-1">
              One row per teacher with header columns <strong>Teacher</strong>,{" "}
              <strong>Subject</strong> (optional) and <strong>P1 … P8</strong>. A period cell that is
              empty or says <em>Free</em> counts as free. Use entries such as{" "}
              <strong>XII B 1-6</strong>, <strong>XI A 1-3</strong>, or{" "}
              <strong>VII E 1,5,6</strong>; line breaks are supported for multiple day/class
              assignments.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Choose file
            </Button>
            <Button variant="ghost" className="flex-1" onClick={downloadTimetableTemplate}>
              <Download /> Template
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm,.ods,.csv,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />

          {fileName && <p className="truncate text-muted-foreground">File: {fileName}</p>}
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
              {error}
            </p>
          )}
          {warnings.map((w) => (
            <p key={w} className="text-xs text-muted-foreground">
              ⚠ {w}
            </p>
          ))}

          {parsed && (
            <div className="rounded-lg border border-border">
              <p className="border-b border-border px-3 py-2 font-medium">
                {parsed.length} teachers detected
              </p>
              <ul className="max-h-48 divide-y divide-border overflow-y-auto">
                {parsed.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.subject}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {8 - Object.values(t.busy).filter(Boolean).length} free
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" disabled={!parsed} onClick={() => apply("merge")}>
            Merge into schedule
          </Button>
          <Button disabled={!parsed} onClick={() => apply("replace")}>
            Replace schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
