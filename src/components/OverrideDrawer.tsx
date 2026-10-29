import { useEffect, useMemo, useState } from "react";
import { Check, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Assignment, Teacher } from "@/lib/substitution";
import { cn } from "@/lib/utils";

type OverrideDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Pick<
    Assignment,
    "period" | "classSection" | "absentTeacherId" | "absentTeacherName" | "subject"
  > | null;
  teachers: Teacher[];
  absentTeacherIds: string[];
  onConfirm: (teacherId: string) => void;
};

export function OverrideDrawer({
  open,
  onOpenChange,
  row,
  teachers,
  absentTeacherIds,
  onConfirm,
}: OverrideDrawerProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTeacherId(null);
  }, [row]);

  const candidates = useMemo(
    () =>
      row
        ? teachers.filter(
            (teacher) =>
              teacher.id !== row.absentTeacherId && !absentTeacherIds.includes(teacher.id),
          )
        : [],
    [absentTeacherIds, row, teachers],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-regular mx-auto max-h-[85vh] w-full max-w-xl border-white/10 bg-white/5 text-foreground">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-foreground">
            <UserRoundCheck className="size-5 text-primary" />
            Override P{row?.period ?? ""}
            {row?.classSection && row.classSection !== "Unassigned"
              ? ` — Class ${row.classSection}`
              : ""}
          </DrawerTitle>
          <DrawerDescription>
            {row
              ? `Choose a substitute to cover ${row.absentTeacherName} · ${row.subject}.`
              : "Choose a substitute for this period."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid max-h-[45vh] gap-2 overflow-y-auto px-4">
          {candidates.map((teacher) => {
            const busy = Boolean(teacher.busy[row?.period ?? 0]);
            const selected = selectedTeacherId === teacher.id;
            return (
              <button
                key={teacher.id}
                type="button"
                disabled={busy}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-sidebar-border bg-white/5 px-4 py-3 text-left transition-colors",
                  busy
                    ? "cursor-not-allowed opacity-45"
                    : "hover:border-primary hover:bg-sidebar-accent",
                  selected && "border-primary bg-sidebar-accent",
                )}
              >
                <span className="flex items-center gap-3">
                  <span>
                    <span className="block font-medium text-foreground">{teacher.name}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {teacher.subject}
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {teacher.category}
                      </Badge>
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", busy ? "text-destructive" : "text-success")}>
                    {busy ? "Busy" : "Free"}
                  </span>
                  {selected && <Check className="size-4 text-primary" />}
                </span>
              </button>
            );
          })}
        </div>
        <DrawerFooter>
          <button
            type="button"
            disabled={!selectedTeacherId}
            onClick={() => selectedTeacherId && onConfirm(selectedTeacherId)}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-50"
          >
            Confirm override
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
