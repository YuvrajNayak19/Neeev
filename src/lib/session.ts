import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { appRoleFromUser, getMe, logout as apiLogout, type Me } from "./auth-api";

export const ME_KEY = ["me"] as const;

/** The signed-in person, their school and their teacher/student record. `null` when signed out. */
export function useMe() {
  return useQuery<Me | null>({ queryKey: ME_KEY, queryFn: getMe, staleTime: 5 * 60_000, retry: false });
}

export function useRole() {
  const me = useMe();
  return me.data ? appRoleFromUser(me.data.user) : null;
}

export function displayName(me: Me | null | undefined): string {
  return me?.user.profile?.name || me?.teacher?.name || me?.student?.name || "there";
}

export function useLogout() {
  const client = useQueryClient();
  return useCallback(async () => {
    await apiLogout().catch(() => undefined);
    client.clear();
    client.setQueryData(ME_KEY, null);
  }, [client]);
}
