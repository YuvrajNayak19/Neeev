import { describe, expect, it } from "vitest";
import { getRouteAccess, isPathAllowedForRole } from "./access";

describe("route access rules", () => {
  it("allows admin to use admin routes and blocks student access", () => {
    expect(getRouteAccess("/admin/dashboard")).toBe("admin");
    expect(isPathAllowedForRole("/admin/dashboard", "admin")).toBe(true);
    expect(isPathAllowedForRole("/admin/dashboard", "student")).toBe(false);
  });

  it("keeps the public pages open to everyone", () => {
    expect(isPathAllowedForRole("/", "student")).toBe(true);
    expect(isPathAllowedForRole("/login", "teacher")).toBe(true);
    expect(isPathAllowedForRole("/schedule", "admin")).toBe(true);
  });
});
