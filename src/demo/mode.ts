/**
 * Tiny flag for the offline sample school (see ./offline.ts). Kept separate so the main bundle can
 * check it without loading the recorded data.
 */
export type DemoRole = "admin" | "teacher" | "student";

const ROLE_KEY = "classsync.offlineDemo.role";
export const STATE_KEY = "classsync.offlineDemo.state";

export function getOfflineRole(): DemoRole | null {
  try {
    const value = localStorage.getItem(ROLE_KEY);
    return value === "admin" || value === "teacher" || value === "student" ? value : null;
  } catch {
    return null;
  }
}

export function setOfflineRole(role: DemoRole | null) {
  try {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else {
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(STATE_KEY);
    }
  } catch {
    /* storage blocked: the demo still works until the page reloads */
  }
}
