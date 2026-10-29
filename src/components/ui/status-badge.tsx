import type { AssignmentStatus, TeacherCategory } from "../../types/domain";
import { cn } from "../../lib/utils";

const assignmentStyles: Record<AssignmentStatus, string> = {
  assigned: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
  unassigned: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

export function StatusBadge({ status }: { status: AssignmentStatus }): JSX.Element {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset", assignmentStyles[status])}>{status}</span>;
}

export function CategoryBadge({ category }: { category: TeacherCategory }): JSX.Element {
  const styles: Record<TeacherCategory, string> = {
    PGT: "bg-violet-50 text-violet-700 ring-violet-600/15",
    TGT: "bg-sky-50 text-sky-700 ring-sky-600/15",
    PRT: "bg-orange-50 text-orange-700 ring-orange-600/15",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", styles[category])}>{category}</span>;
}
