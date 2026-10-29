export type PublicStat = {
  label: string;
  value: string;
  detail: string;
};

const fallbackStats: PublicStat[] = [
  { label: "0 clashes", value: "0", detail: "validated timetable conflicts" },
  { label: "Under 5s", value: "< 5s", detail: "generate from the latest master schedule" },
  { label: "100% covered", value: "100%", detail: "required periods assigned" },
];

export async function fetchPublicStats(): Promise<PublicStat[]> {
  try {
    const response = await fetch("/api/public/stats");
    if (!response.ok) {
      throw new Error("Stats endpoint unavailable");
    }

    const data = (await response.json()) as PublicStat[];
    return Array.isArray(data) && data.length > 0 ? data : fallbackStats;
  } catch {
    return fallbackStats;
  }
}

export async function fetchFeatureCards() {
  return [
    { title: "Auto-generated timetable", copy: "Build a clash-free weekly timetable in seconds with teacher and room constraints.", icon: "calendar-clock" },
    { title: "Smart substitutions", copy: "Resolve absences from the latest master timetable without double-booking staff.", icon: "shuffle" },
    { title: "Teacher requests", copy: "Leave notices, extra-period requests, and approvals live in a single inbox.", icon: "inbox" },
    { title: "Student view", copy: "Students see class routines, updates and substitutions in a focused view.", icon: "graduation-cap" },
    { title: "Print & share", copy: "Export a clean timetable or send a quick summary to staff and families.", icon: "printer" },
    { title: "Offline ready", copy: "The latest timetable remains available even when the network drops briefly.", icon: "wifi-off" },
  ];
}
