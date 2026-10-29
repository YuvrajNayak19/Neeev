export type AppRole = "admin" | "teacher" | "student";
export type RouteAccess = "public" | AppRole;

const routes: Record<string, RouteAccess> = {
  "/": "public",
  "/login": "public",
  "/schedule": "public",
  "/admin/dashboard": "admin",
  "/admin/timetable": "admin",
  "/admin/substitutions": "admin",
  "/admin/requests": "admin",
  "/admin/complaints": "admin",
  "/admin/setup": "admin",
  "/teacher/dashboard": "teacher",
  "/teacher/routine": "teacher",
  "/teacher/requests": "teacher",
  "/student": "student",
  "/student/weekly": "student",
  "/student/complaints": "student",
  "/403": "public",
};

export function getRouteAccess(path: string): RouteAccess {
  const normalized = path.split("?")[0] || "/";
  return routes[normalized] ?? "public";
}

export function isPathAllowedForRole(path: string, role?: AppRole | null): boolean {
  if (!role) {
    return getRouteAccess(path) === "public";
  }

  const access = getRouteAccess(path);
  return access === "public" || access === role;
}
