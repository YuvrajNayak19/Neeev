/** Subject → colour family. Classes resolve to tokens defined in src/index.css. */
export type SubjectFamily = "math" | "sci" | "eng" | "hin" | "sst" | "comp" | "art" | "pe" | "other";

const RULES: Array<[RegExp, SubjectFamily]> = [
  [/math/i, "math"],
  [/science|physics|chemistry|biology|evs/i, "sci"],
  [/english/i, "eng"],
  [/hindi|sanskrit/i, "hin"],
  [/social|history|geography|civics|economics|sst/i, "sst"],
  [/computer|\bit\b|informatics|coding/i, "comp"],
  [/art|music|dance|craft/i, "art"],
  [/physical|\bpe\b|sport|yoga|games/i, "pe"],
];

export function subjectFamily(name?: string | null): SubjectFamily {
  if (!name) return "other";
  return RULES.find(([pattern]) => pattern.test(name))?.[1] ?? "other";
}

/** Background + text classes per family (kept literal so Tailwind can see them). */
export const SUBJECT_CLASSES: Record<SubjectFamily, { cell: string; dot: string; text: string }> = {
  math: { cell: "bg-subject-math-bg text-subject-math", dot: "bg-subject-math", text: "text-subject-math" },
  sci: { cell: "bg-subject-sci-bg text-subject-sci", dot: "bg-subject-sci", text: "text-subject-sci" },
  eng: { cell: "bg-subject-eng-bg text-subject-eng", dot: "bg-subject-eng", text: "text-subject-eng" },
  hin: { cell: "bg-subject-hin-bg text-subject-hin", dot: "bg-subject-hin", text: "text-subject-hin" },
  sst: { cell: "bg-subject-sst-bg text-subject-sst", dot: "bg-subject-sst", text: "text-subject-sst" },
  comp: { cell: "bg-subject-comp-bg text-subject-comp", dot: "bg-subject-comp", text: "text-subject-comp" },
  art: { cell: "bg-subject-art-bg text-subject-art", dot: "bg-subject-art", text: "text-subject-art" },
  pe: { cell: "bg-subject-pe-bg text-subject-pe", dot: "bg-subject-pe", text: "text-subject-pe" },
  other: { cell: "bg-subject-other-bg text-subject-other", dot: "bg-subject-other", text: "text-subject-other" },
};

export function subjectClasses(name?: string | null) {
  return SUBJECT_CLASSES[subjectFamily(name)];
}

/** Short label for tight cells, e.g. "Social Science" → "SST". */
export function subjectShort(name?: string | null): string {
  if (!name) return "—";
  const map: Record<string, string> = {
    mathematics: "Maths",
    "social science": "SST",
    "physical education": "PE",
    computer: "Computer",
    science: "Science",
    english: "English",
    hindi: "Hindi",
    art: "Art",
    sanskrit: "Sanskrit",
  };
  return map[name.toLowerCase()] ?? name;
}
