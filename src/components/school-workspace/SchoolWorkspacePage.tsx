import { LayoutGrid, Radio, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { DailyAbsenceAndSubDashboard } from "../operations/DailyAbsenceAndSubDashboard";
import { MasterTimetableGrid } from "../timetable/MasterTimetableGrid";
import { StudentClassScheduleView } from "../student/StudentClassScheduleView";
import { demoAbsences, demoAssignments, demoClassSections, demoMasterTimetable, demoSchoolId, demoSubjects, demoTeachers } from "../../lib/school-demo";
import { generateSmartSubstitutions } from "../../lib/smart-substitutions";

type WorkspaceView = "routine" | "operations" | "student";

export function SchoolWorkspacePage({ date }: { date: string }): JSX.Element {
  const [view, setView] = useState<WorkspaceView>("routine");
  const [classSectionId, setClassSectionId] = useState(demoClassSections[0].id);
  const [generationNonce, setGenerationNonce] = useState(0);
  const generated = useMemo(() => generateSmartSubstitutions({ schoolId: demoSchoolId, date, teachers: demoTeachers, subjects: demoSubjects, classSections: demoClassSections, assignments: demoAssignments, masterTimetable: demoMasterTimetable, absences: demoAbsences.filter((absence) => absence.date === date) }), [date, generationNonce]);
  const schoolDay = new Date(`${date}T12:00:00Z`).getUTCDay();
  const displayDay = schoolDay >= 1 && schoolDay <= 6 ? schoolDay as 1 | 2 | 3 | 4 | 5 | 6 : 1;

  return <section className="space-y-6"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">School structure</p><h1 className="mt-1 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-950">Timetable workspace</h1><p className="mt-1.5 text-sm text-slate-500">Classes, weekly routines, and context-aware daily cover in one place.</p></div><div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Workspace views"><ViewButton active={view === "routine"} icon={<LayoutGrid size={15} />} label="Master routine" onClick={() => setView("routine")} /><ViewButton active={view === "operations"} icon={<Radio size={15} />} label="Daily cover" onClick={() => setView("operations")} /><ViewButton active={view === "student"} icon={<UsersRound size={15} />} label="Student view" onClick={() => setView("student")} /></div></header>{view === "routine" && <MasterTimetableGrid classSections={demoClassSections} teachers={demoTeachers} subjects={demoSubjects} timetable={demoMasterTimetable} selectedClassSectionId={classSectionId} onClassSectionChange={setClassSectionId} />}{view === "operations" && <DailyAbsenceAndSubDashboard date={date} teachers={demoTeachers} absences={demoAbsences.filter((absence) => absence.date === date)} substitutions={generated.substitutions} onGenerate={() => setGenerationNonce((current) => current + 1)} />}{view === "student" && <StudentClassScheduleView classSections={demoClassSections} selectedClassSectionId={classSectionId} date={date} dayOfWeek={displayDay} timetable={demoMasterTimetable} substitutions={generated.substitutions} subjects={demoSubjects} teachers={demoTeachers} onClassChange={setClassSectionId} />}</section>;
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }): JSX.Element {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{icon}<span className="hidden sm:inline">{label}</span></button>;
}
