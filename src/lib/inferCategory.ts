import type { Category } from "@/lib/substitution";

const ROMAN_LEVELS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

function classLevels(value: string): number[] {
  const normalized = value.toUpperCase().replace(/[–—]/g, "-");
  const levels: number[] = [];
  const romanPattern = /\b(XII|XI|VIII|VII|VI|IX|X|IV|V|III|II|I)\b/g;
  const numericPattern = /(?:^|[^\d])(1[0-2]|[1-9])(?:\s*[A-Z]|[-\s]|$)/g;

  for (const match of normalized.matchAll(romanPattern)) {
    const level = match[1] ? ROMAN_LEVELS[match[1]] : undefined;
    if (level) levels.push(level);
  }
  for (const match of normalized.matchAll(numericPattern)) levels.push(Number(match[1]));
  return levels;
}

export function inferTeacherCategoryFromClasses(classesTaught: string[]): Category {
  const levels = classesTaught
    .flatMap(classLevels);
  const highest = levels.length > 0 ? Math.max(...levels) : null;

  if (highest !== null && highest >= 11) return "PGT";
  if (highest !== null && highest >= 6) return "TGT";
  if (highest !== null && highest >= 1) return "PRT";
  return "TGT";
}
