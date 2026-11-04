export type AppRole = "admin" | "teacher" | "student";
/** "auth" = any signed-in role. */
export type RouteAccess = "public" | "auth" | AppRole;

const routes: Record<string, RouteAccess> = {
  "/": "public",
  "/login": "public",
  "/register": "public",
  "/schedule": "public",
  "/privacy": "public",
  "/terms": "public",
  "/403": "public",
  "/account": "auth",
  "/admin/dashboard": "admin",
  "/admin/timetable": "admin",
  "/admin/substitutions": "admin",
  "/admin/requests": "admin",
  "/admin/accounts": "admin",
  "/admin/concerns": "admin",
  "/teacher/dashboard": "teacher",
  "/teacher/routine": "teacher",
  "/teacher/requests": "teacher",
  "/student": "student",
  "/student/weekly": "student",
  "/student/concerns": "student",
};

export function getRouteAccess(path: string): RouteAccess {
  const normalized = path.split("?")[0] || "/";
  return routes[normalized] ?? "public";
}

export function isPathAllowedForRole(path: string, role?: AppRole | null): boolean {
  const access = getRouteAccess(path);
  if (access === "public") return true;
  if (!role) return false;
  return access === "auth" || access === role;
}
