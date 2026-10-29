import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { timelyApi } from "../api/timely-api";
import type { CreateAbsenceInput, CreateTeacherInput } from "../types/domain";

export const timelyKeys = {
  session: ["session"] as const,
  teachers: ["teachers"] as const,
  absences: (date: string) => ["absences", date] as const,
  schedule: (date: string) => ["schedule", date] as const,
  history: ["schedule-history"] as const,
  stats: (date: string) => ["stats", date] as const,
};

const invalidateDailyData = (queryClient: ReturnType<typeof useQueryClient>, date: string): Promise<void> =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: timelyKeys.absences(date) }),
    queryClient.invalidateQueries({ queryKey: timelyKeys.schedule(date) }),
    queryClient.invalidateQueries({ queryKey: timelyKeys.stats(date) }),
    queryClient.invalidateQueries({ queryKey: timelyKeys.history }),
  ]).then(() => undefined);

export const useSession = () => useQuery({ queryKey: timelyKeys.session, queryFn: timelyApi.getSession });
export const useTeachers = () => useQuery({ queryKey: timelyKeys.teachers, queryFn: timelyApi.getTeachers });
export const useAbsences = (date: string) => useQuery({ queryKey: timelyKeys.absences(date), queryFn: () => timelyApi.getAbsences(date) });
export const useSchedule = (date: string) => useQuery({ queryKey: timelyKeys.schedule(date), queryFn: () => timelyApi.getSchedule(date) });
export const useHistory = () => useQuery({ queryKey: timelyKeys.history, queryFn: timelyApi.getHistory });
export const useStats = (date: string) => useQuery({ queryKey: timelyKeys.stats(date), queryFn: () => timelyApi.getStats(date) });

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTeacherInput) => timelyApi.createTeacher(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: timelyKeys.teachers }) });
};

export const useCreateAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateAbsenceInput) => timelyApi.createAbsence(input), onSuccess: (_, input) => invalidateDailyData(queryClient, input.date) });
};

export const useRemoveAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ absenceId }: { absenceId: string; date: string }) => timelyApi.removeAbsence(absenceId),
    onSuccess: (_, variables) => invalidateDailyData(queryClient, variables.date),
  });
};

export const useGenerateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: timelyApi.generateSchedule, onSuccess: (_, date) => invalidateDailyData(queryClient, date) });
};
