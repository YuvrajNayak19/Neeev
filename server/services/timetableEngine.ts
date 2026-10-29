export type Cat = "TGT" | "PGT" | "PRT";
export const RANK: Record<Cat, number> = { PRT: 1, TGT: 2, PGT: 3 };
export const PRT_MAX_GRADE = 8;
export const DAYS_PER_WEEK = 6;
export const PERIODS_PER_DAY = 8;
export const LUNCH_AFTER_PERIOD = 4;
export const SLOTS_PER_WEEK = DAYS_PER_WEEK * PERIODS_PER_DAY;
export const MAX_CONSECUTIVE_PERIODS = 3;

/** Longest teaching run (lunch recess breaks a run) if `size` periods are added at `period`, given the day's busy periods (1-based). */
export function longestRunWith(busy: (period: number) => boolean, period: number, size: number): number {
  const lo = period <= LUNCH_AFTER_PERIOD ? 1 : LUNCH_AFTER_PERIOD + 1;
  const hi = period <= LUNCH_AFTER_PERIOD ? LUNCH_AFTER_PERIOD : PERIODS_PER_DAY;
  let start = period, end = period + size - 1;
  while (start - 1 >= lo && busy(start - 1)) start--;
  while (end + 1 <= hi && busy(end + 1)) end++;
  return end - start + 1;
}

export interface CoreTeacher { id: string; name: string; cat: Cat; subjectIds: string[]; maxPerDay: number; maxPerWeek: number }
export interface CoreClass { id: string; grade: number; label: string; stream?: string }
export interface CoreSubject {
  id: string; name: string; cat: Cat; weekly: number; minPerDay: number; maxPerDay: number;
  maxDaysPerWeek?: number; priority: number; doublePeriod: boolean; grades: number[]; streams: string[]; classIds?: string[];
}
export interface CoreAssignment { classId: string; subjectId: string; teacherId: string; isForced?: boolean }
export interface CoreSlot { classId: string; day: number; period: number; subjectId: string; teacherId: string; isLocked?: boolean; isForced?: boolean }
export interface CoreInput { classes: CoreClass[]; subjects: CoreSubject[]; teachers: CoreTeacher[]; assignments: CoreAssignment[]; locked?: CoreSlot[] }
export interface SolveOptions { maxAttempts?: number; stepBudget?: number; seed?: number }
export interface SolveResult {
  ok: boolean; slots: CoreSlot[]; errors: string[]; warnings: string[];
  attempts: number; steps: number; ms: number; requestedPeriods: number;
}

export function gradeRuleProblem(t: Pick<CoreTeacher, "name" | "cat">, grade: number): string | null {
  if (grade >= 11 && t.cat !== "PGT") return `${t.name} is a ${t.cat}; classes 11 and 12 can only be taught by a PGT.`;
  if (t.cat === "TGT" && grade > 10) return `${t.name} is a TGT and cannot teach class ${grade}.`;
  if (t.cat === "PRT" && grade > PRT_MAX_GRADE) return `${t.name} is a PRT and cannot teach class ${grade}.`;
  return null;
}

export function subjectRuleProblem(t: CoreTeacher, s: CoreSubject): string | null {
  if (!t.subjectIds.includes(s.id)) return `${t.name} is not listed as a ${s.name} teacher.`;
  if (RANK[t.cat] < RANK[s.cat]) return `${s.name} needs a ${s.cat}, but ${t.name} is a ${t.cat}.`;
  return null;
}

export function qualificationProblem(t: CoreTeacher, grade: number, s: CoreSubject, forced = false): string | null {
  return gradeRuleProblem(t, grade) ?? (forced ? null : subjectRuleProblem(t, s));
}

export const canTeach = (t: CoreTeacher, grade: number, s: CoreSubject): boolean => qualificationProblem(t, grade, s) === null;

export function subjectApplies(s: CoreSubject, c: CoreClass): boolean {
  if (s.classIds?.length && !s.classIds.includes(c.id)) return false;
  if (s.grades.length && !s.grades.includes(c.grade)) return false;
  return !s.streams.length || (!!c.stream && s.streams.includes(c.stream));
}

function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

interface Pair { ci: number; si: number; ti: number; forced: boolean; need: number }
interface Lesson { k: number; size: 1 | 2 }

export function solve(input: CoreInput, opts: SolveOptions = {}): SolveResult {
  const started = Date.now();
  const result: SolveResult = { ok: false, slots: [], errors: [], warnings: [], attempts: 0, steps: 0, ms: 0, requestedPeriods: 0 };
  const { classes, subjects, teachers } = input;
  const locked = input.locked ?? [];
  const classIndex = new Map(classes.map((item, index) => [item.id, index]));
  const subjectIndex = new Map(subjects.map((item, index) => [item.id, index]));
  const teacherIndex = new Map(teachers.map((item, index) => [item.id, index]));
  const assignmentMap = new Map(input.assignments.map(item => [`${item.classId}|${item.subjectId}`, item]));
  const pairs: Pair[] = [];
  const classTotals = new Array(classes.length).fill(0) as number[];

  classes.forEach((schoolClass, ci) => subjects.forEach((subject, si) => {
    if (!subjectApplies(subject, schoolClass)) return;
    classTotals[ci] += subject.weekly;
    const assignment = assignmentMap.get(`${schoolClass.id}|${subject.id}`);
    if (!assignment) { result.errors.push(`Class ${schoolClass.label} has no teacher assigned for ${subject.name}.`); return; }
    const ti = teacherIndex.get(assignment.teacherId);
    if (ti === undefined) { result.errors.push(`Class ${schoolClass.label} ${subject.name}: the assigned teacher no longer exists.`); return; }
    const problem = qualificationProblem(teachers[ti], schoolClass.grade, subject, !!assignment.isForced);
    if (problem) result.errors.push(`Class ${schoolClass.label} ${subject.name}: ${problem}`);
    if (subject.weekly > DAYS_PER_WEEK * subject.maxPerDay) result.errors.push(`${subject.name} needs ${subject.weekly} periods a week but allows only ${subject.maxPerDay} per day.`);
    if (subject.weekly < DAYS_PER_WEEK * subject.minPerDay) result.errors.push(`${subject.name} must appear ${subject.minPerDay} time(s) every day, which needs at least ${DAYS_PER_WEEK * subject.minPerDay} periods a week.`);
    if (subject.maxDaysPerWeek && subject.weekly > subject.maxDaysPerWeek * subject.maxPerDay) result.errors.push(`${subject.name} cannot fit ${subject.weekly} periods on ${subject.maxDaysPerWeek} day(s).`);
    if (subject.doublePeriod && subject.maxPerDay < 2) result.errors.push(`${subject.name} is a double-period subject, so max per day must be at least 2.`);
    pairs.push({ ci, si, ti, forced: !!assignment.isForced, need: subject.weekly });
    result.requestedPeriods += subject.weekly;
  }));

  classes.forEach((item, ci) => {
    if (classTotals[ci] > SLOTS_PER_WEEK) result.errors.push(`Class ${item.label} needs ${classTotals[ci]} periods a week but only ${SLOTS_PER_WEEK} exist.`);
  });
  const teacherLoads = new Array(teachers.length).fill(0) as number[];
  pairs.forEach(pair => { teacherLoads[pair.ti] += pair.need; });
  teachers.forEach((teacher, ti) => {
    if (teacherLoads[ti] > teacher.maxPerWeek) result.errors.push(`${teacher.name} is assigned ${teacherLoads[ti]} periods a week but the weekly limit is ${teacher.maxPerWeek}.`);
    if (Math.ceil(teacherLoads[ti] / DAYS_PER_WEEK) > teacher.maxPerDay) result.errors.push(`${teacher.name} is assigned ${teacherLoads[ti]} periods a week, which cannot fit under ${teacher.maxPerDay} periods a day.`);
  });
  if (result.errors.length) { result.ms = Date.now() - started; return result; }

  const pairIndex = new Map(pairs.map((pair, index) => [`${pair.ci}|${pair.si}`, index]));
  const maxAttempts = opts.maxAttempts ?? 30;
  const stepBudget = opts.stepBudget ?? 250_000;
  const baseSeed = opts.seed ?? 12345;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result.attempts = attempt;
    const random = rng(baseSeed + attempt * 7919);
    const busyClass = new Uint8Array(classes.length * DAYS_PER_WEEK * PERIODS_PER_DAY);
    const busyTeacher = new Uint8Array(teachers.length * DAYS_PER_WEEK * PERIODS_PER_DAY);
    const teacherDayLoad = new Uint8Array(teachers.length * DAYS_PER_WEEK);
    const grid = new Int16Array(classes.length * DAYS_PER_WEEK * PERIODS_PER_DAY).fill(-1);
    const periodCount = new Uint8Array(pairs.length * DAYS_PER_WEEK);
    const remaining = new Int16Array(pairs.length);
    const daysUsed = new Uint8Array(pairs.length);
    const minDeficit = new Int16Array(pairs.length);
    const fixedSlots: CoreSlot[] = [];
    pairs.forEach((pair, k) => { remaining[k] = pair.need; minDeficit[k] = subjects[pair.si].minPerDay * DAYS_PER_WEEK; });

    const mark = (ci: number, ti: number, day: number, period: number, size: number, si: number, k: number, sign: 1 | -1): void => {
      for (let offset = 0; offset < size; offset++) {
        const index = (ci * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 1 + offset;
        busyClass[index] = sign === 1 ? 1 : 0;
        busyTeacher[(ti * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 1 + offset] = sign === 1 ? 1 : 0;
        grid[index] = sign === 1 ? si : -1;
      }
      teacherDayLoad[ti * DAYS_PER_WEEK + day] += sign * size;
      if (k < 0) return;
      const min = subjects[si].minPerDay;
      const before = periodCount[k * DAYS_PER_WEEK + day];
      const after = before + sign * size;
      if (sign === 1 && before === 0) daysUsed[k]++;
      if (sign === -1 && after === 0) daysUsed[k]--;
      minDeficit[k] += Math.max(0, min - after) - Math.max(0, min - before);
      periodCount[k * DAYS_PER_WEEK + day] = after;
      remaining[k] -= sign * size;
    };

    let lockedValid = true;
    for (const slot of locked) {
      const ci = classIndex.get(slot.classId), ti = teacherIndex.get(slot.teacherId), si = subjectIndex.get(slot.subjectId);
      if (ci === undefined || ti === undefined || si === undefined || slot.day < 0 || slot.day >= DAYS_PER_WEEK || slot.period < 1 || slot.period > PERIODS_PER_DAY) continue;
      const index = (ci * DAYS_PER_WEEK + slot.day) * PERIODS_PER_DAY + slot.period - 1;
      if (busyClass[index] || busyTeacher[(ti * DAYS_PER_WEEK + slot.day) * PERIODS_PER_DAY + slot.period - 1]) {
        lockedValid = false;
        result.errors.push(`Locked slots clash: class ${classes[ci].label}, day ${slot.day + 1}, period ${slot.period}.`);
        break;
      }
      const k = pairIndex.get(`${ci}|${si}`) ?? -1;
      mark(ci, ti, slot.day, slot.period, 1, si, k, 1);
      fixedSlots.push({ ...slot, isLocked: true });
    }
    if (!lockedValid) break;

    const lessons: Lesson[] = [];
    pairs.forEach((pair, k) => {
      let left = remaining[k];
      if (subjects[pair.si].doublePeriod) while (left >= 2) { lessons.push({ k, size: 2 }); left -= 2; }
      while (left > 0) { lessons.push({ k, size: 1 }); left--; }
    });
    const ordered = lessons.map(lesson => ({ lesson, score: teacherLoads[pairs[lesson.k].ti] * 100 + classes[pairs[lesson.k].ci].grade * 3 + subjects[pairs[lesson.k].si].priority + random() }));
    ordered.sort((a, b) => b.score - a.score || a.lesson.k - b.lesson.k);
    const byPair = new Map<number, Lesson[]>();
    ordered.forEach(({ lesson }) => { const list = byPair.get(lesson.k) ?? []; list.push(lesson); byPair.set(lesson.k, list); });
    const seen = new Set<number>();
    const sequence: Lesson[] = [];
    ordered.forEach(({ lesson }) => { if (!seen.has(lesson.k)) { seen.add(lesson.k); sequence.push(...(byPair.get(lesson.k) ?? [])); } });
    const assigned = new Int16Array(sequence.length).fill(-1);
    let steps = 0;

    const place = (index: number): boolean => {
      if (index === sequence.length) return true;
      if (++steps > stepBudget) return false;
      const { k, size } = sequence[index];
      const pair = pairs[k], subject = subjects[pair.si], teacher = teachers[pair.ti];
      const candidates: Array<{ day: number; period: number; score: number }> = [];
      for (let day = 0; day < DAYS_PER_WEEK; day++) {
        const have = periodCount[k * DAYS_PER_WEEK + day];
        if (have + size > subject.maxPerDay || teacherDayLoad[pair.ti * DAYS_PER_WEEK + day] + size > teacher.maxPerDay) continue;
        if (subject.maxDaysPerWeek && have === 0 && daysUsed[k] + 1 > subject.maxDaysPerWeek) continue;
        const reduce = have < subject.minPerDay ? Math.min(size, subject.minPerDay - have) : 0;
        if (minDeficit[k] - reduce > remaining[k] - size) continue;
        for (let period = 1; period + size - 1 <= PERIODS_PER_DAY; period++) {
          if (size === 2 && period === LUNCH_AFTER_PERIOD) continue;
          let free = true;
          for (let offset = 0; offset < size; offset++) {
            const slot = (pair.ci * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 1 + offset;
            if (busyClass[slot] || busyTeacher[(pair.ti * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 1 + offset]) free = false;
          }
          if (!free) continue;
          const teacherBase = (pair.ti * DAYS_PER_WEEK + day) * PERIODS_PER_DAY;
          if (longestRunWith(p => !!busyTeacher[teacherBase + p - 1], period, size) > MAX_CONSECUTIVE_PERIODS) continue;
          let score = teacherDayLoad[pair.ti * DAYS_PER_WEEK + day] * 2 + have * 5 + (period - 1) * subject.priority * 0.35 + random();
          if (reduce > 0) score -= 40;
          if (subject.doublePeriod && period + size - 1 === PERIODS_PER_DAY) score += 25;
          const before = period > 1 ? grid[(pair.ci * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 2] : -1;
          const after = period + size <= PERIODS_PER_DAY ? grid[(pair.ci * DAYS_PER_WEEK + day) * PERIODS_PER_DAY + period - 1 + size] : -1;
          if (before === pair.si || after === pair.si) score += 4;
          candidates.push({ day, period, score });
        }
      }
      candidates.sort((a, b) => a.score - b.score);
      for (const candidate of candidates) {
        mark(pair.ci, pair.ti, candidate.day, candidate.period, size, pair.si, k, 1);
        assigned[index] = candidate.day * PERIODS_PER_DAY + candidate.period - 1;
        if (place(index + 1)) return true;
        mark(pair.ci, pair.ti, candidate.day, candidate.period, size, pair.si, k, -1);
        assigned[index] = -1;
        if (steps > stepBudget) return false;
      }
      return false;
    };

    const solved = place(0);
    result.steps += steps;
    if (!solved) continue;
    const slots = [...fixedSlots];
    sequence.forEach((lesson, index) => {
      const pair = pairs[lesson.k];
      const day = Math.floor(assigned[index] / PERIODS_PER_DAY);
      const firstPeriod = assigned[index] % PERIODS_PER_DAY + 1;
      for (let offset = 0; offset < lesson.size; offset++) {
        slots.push({ classId: classes[pair.ci].id, day, period: firstPeriod + offset, subjectId: subjects[pair.si].id, teacherId: teachers[pair.ti].id, isForced: pair.forced || undefined });
      }
    });
    slots.sort((a, b) => a.classId.localeCompare(b.classId) || a.day - b.day || a.period - b.period);
    result.slots = slots;
    result.ok = true;
    break;
  }

  if (!result.ok && !result.errors.length) result.errors.push(`No clash-free timetable found after ${result.attempts} attempts. Review weekly loads, daily limits, and subject constraints.`);
  if (!result.ok && result.attempts) {
    const heavilyLoaded = teachers
      .map((teacher, index) => ({ teacher, utilization: teacherLoads[index] / teacher.maxPerWeek }))
      .filter(item => item.utilization >= 0.9)
      .map(item => `${item.teacher.name} (${Math.round(item.utilization * 100)}% of weekly limit)`);
    const fullClasses = classes.filter((_, index) => classTotals[index] >= SLOTS_PER_WEEK).map(item => item.label);
    if (heavilyLoaded.length) result.errors.push(`Heavily loaded teachers: ${heavilyLoaded.slice(0, 6).join(", ")}. Add a teacher or move a section to a lighter teacher.`);
    if (fullClasses.length) result.errors.push(`Classes with no spare period: ${fullClasses.slice(0, 8).join(", ")}. Freeing one period per class makes generation much easier.`);
  }
  result.ms = Date.now() - started;
  return result;
}

export function validateTimetable(input: CoreInput, slots: CoreSlot[]): string[] {
  const errors: string[] = [];
  const classes = new Map(input.classes.map(item => [item.id, item]));
  const subjects = new Map(input.subjects.map(item => [item.id, item]));
  const teachers = new Map(input.teachers.map(item => [item.id, item]));
  const assignments = new Map(input.assignments.map(item => [`${item.classId}|${item.subjectId}`, item]));
  const classOccupied = new Set<string>(), teacherOccupied = new Set<string>();
  const teacherDay = new Map<string, number>(), teacherWeek = new Map<string, number>();
  const pairDay = new Map<string, number>(), pairWeek = new Map<string, number>();
  for (const slot of slots) {
    const schoolClass = classes.get(slot.classId), subject = subjects.get(slot.subjectId), teacher = teachers.get(slot.teacherId);
    if (!schoolClass || !subject || !teacher) { errors.push(`Slot refers to unknown class, subject or teacher (${slot.classId}/${slot.subjectId}/${slot.teacherId}).`); continue; }
    const where = `${schoolClass.label} day ${slot.day + 1} period ${slot.period}`;
    if (slot.day < 0 || slot.day >= DAYS_PER_WEEK || slot.period < 1 || slot.period > PERIODS_PER_DAY) errors.push(`${where}: outside the school week.`);
    const classKey = `${slot.classId}|${slot.day}|${slot.period}`, teacherKey = `${slot.teacherId}|${slot.day}|${slot.period}`;
    if (classOccupied.has(classKey)) errors.push(`${where}: class has two lessons at once.`);
    if (teacherOccupied.has(teacherKey)) errors.push(`${where}: ${teacher.name} is in two classes at once.`);
    classOccupied.add(classKey); teacherOccupied.add(teacherKey);
    const assignment = assignments.get(`${slot.classId}|${slot.subjectId}`);
    if (!assignment || assignment.teacherId !== slot.teacherId) errors.push(`${where}: ${teacher.name} is not the assigned teacher for ${subject.name}.`);
    const qualification = qualificationProblem(teacher, schoolClass.grade, subject, !!assignment?.isForced);
    if (qualification) errors.push(`${where}: ${qualification}`);
    teacherDay.set(`${slot.teacherId}|${slot.day}`, (teacherDay.get(`${slot.teacherId}|${slot.day}`) ?? 0) + 1);
    teacherWeek.set(slot.teacherId, (teacherWeek.get(slot.teacherId) ?? 0) + 1);
    const pair = `${slot.classId}|${slot.subjectId}`;
    pairDay.set(`${pair}|${slot.day}`, (pairDay.get(`${pair}|${slot.day}`) ?? 0) + 1);
    pairWeek.set(pair, (pairWeek.get(pair) ?? 0) + 1);
  }
  teacherDay.forEach((count, key) => { const [teacherId, day] = key.split("|"); const teacher = teachers.get(teacherId)!; if (count > teacher.maxPerDay) errors.push(`${teacher.name} has ${count} periods on day ${Number(day) + 1} (limit ${teacher.maxPerDay}).`); });
  teacherWeek.forEach((count, id) => { const teacher = teachers.get(id)!; if (count > teacher.maxPerWeek) errors.push(`${teacher.name} has ${count} periods this week (limit ${teacher.maxPerWeek}).`); });
  teacherDay.forEach((_, key) => {
    const [teacherId, day] = key.split("|");
    for (let period = 1; period <= PERIODS_PER_DAY; period++) {
      const busy = (p: number) => teacherOccupied.has(`${teacherId}|${day}|${p}`);
      if (busy(period) && (!busy(period - 1) || period === LUNCH_AFTER_PERIOD + 1) && longestRunWith(busy, period, 1) > MAX_CONSECUTIVE_PERIODS) errors.push(`${teachers.get(teacherId)!.name} teaches more than ${MAX_CONSECUTIVE_PERIODS} consecutive periods on day ${Number(day) + 1}.`);
    }
  });
  for (const schoolClass of input.classes) for (const subject of input.subjects) {
    if (!subjectApplies(subject, schoolClass)) continue;
    const key = `${schoolClass.id}|${subject.id}`;
    if ((pairWeek.get(key) ?? 0) !== subject.weekly) errors.push(`${schoolClass.label} ${subject.name}: has ${pairWeek.get(key) ?? 0} periods, needs ${subject.weekly}.`);
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const count = pairDay.get(`${key}|${day}`) ?? 0;
      if (count > subject.maxPerDay) errors.push(`${schoolClass.label} ${subject.name}: ${count} periods on day ${day + 1} (max ${subject.maxPerDay}).`);
      if (count < subject.minPerDay) errors.push(`${schoolClass.label} ${subject.name}: only ${count} period(s) on day ${day + 1} (min ${subject.minPerDay}).`);
    }
    const usedDays = Array.from({ length: DAYS_PER_WEEK }, (_, day) => pairDay.get(`${key}|${day}`) ?? 0).filter(count => count > 0).length;
    if (subject.maxDaysPerWeek && usedDays > subject.maxDaysPerWeek) errors.push(`${schoolClass.label} ${subject.name}: spread over ${usedDays} days (max ${subject.maxDaysPerWeek}).`);
    if (subject.doublePeriod) {
      for (let day = 0; day < DAYS_PER_WEEK; day++) {
        const periods = slots.filter(slot => slot.classId === schoolClass.id && slot.subjectId === subject.id && slot.day === day).map(slot => slot.period).sort((a, b) => a - b);
        for (let index = 0; index < periods.length; index += 2) {
          if (periods[index + 1] !== undefined && (periods[index + 1] !== periods[index] + 1 || periods[index] === LUNCH_AFTER_PERIOD)) {
            errors.push(`${schoolClass.label} ${subject.name}: double period is not two consecutive periods before/after lunch.`);
          }
        }
      }
    }
  }
  return errors;
}