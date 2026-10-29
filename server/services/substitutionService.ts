import { gradeRuleProblem } from "./timetableEngine";

export type TeacherQualification = "PRT" | "TGT" | "PGT";

export type SubstituteCandidate = {
  id: string;
  name: string;
  qualificationCategory: TeacherQualification;
  subjectId?: string;
  primarySubjects?: string[];
  currentLoadToday?: number;
  isAvailable?: boolean;
};

export type RankTarget = {
  subjectId?: string;
  grade?: number;
  targetTeacherCategory?: TeacherQualification;
};

export function getQualificationThresholdForGrade(grade?: number): TeacherQualification {
  if (!grade) return "TGT";
  return grade >= 11 ? "PGT" : "TGT";
}

export function scoreCandidateForSubstitution(
  candidate: SubstituteCandidate,
  target: RankTarget,
): { tier: number; score: number } {
  if (target.grade !== undefined && gradeRuleProblem({ name: candidate.name, cat: candidate.qualificationCategory }, target.grade)) {
    return { tier: Number.POSITIVE_INFINITY, score: Number.NEGATIVE_INFINITY };
  }
  const requiredCategory = getQualificationThresholdForGrade(target.grade);

  if (candidate.qualificationCategory === "PGT" && requiredCategory === "PGT") {
    return { tier: 1, score: 90 };
  }

  if (candidate.subjectId && target.subjectId && candidate.subjectId === target.subjectId) {
    return { tier: 1, score: 80 };
  }

  if (candidate.qualificationCategory === requiredCategory || candidate.qualificationCategory === "PGT") {
    return { tier: 2, score: 60 };
  }

  const loadPenalty = candidate.currentLoadToday ?? 0;
  return { tier: 3, score: 40 - loadPenalty };
}

export function pickBestSubstitute(candidates: SubstituteCandidate[], target: RankTarget) {
  const ranked = [...candidates]
    .filter((candidate) => candidate.isAvailable !== false && !(target.grade !== undefined && gradeRuleProblem({ name: candidate.name, cat: candidate.qualificationCategory }, target.grade)))
    .map((candidate) => ({ candidate, ...scoreCandidateForSubstitution(candidate, target) }))
    .sort((left, right) => {
      if (left.tier !== right.tier) return left.tier - right.tier;
      if (right.score !== left.score) return right.score - left.score;
      return left.candidate.name.localeCompare(right.candidate.name);
    });

  return ranked[0] ?? null;
}

export function buildFallbackSubstitutionReason() {
  return "No qualified teacher available; assigned to self-study review";
}
