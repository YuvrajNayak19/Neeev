import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { schoolScope, scopedIdFilter } from "./tenant";

describe("tenant scope helpers", () => {
  it("derives a tenant filter only from authenticated context", () => {
    const request = { user: { userId: "a-user", schoolId: "school-a", role: "SCHOOL_ADMIN" } } as Request;
    expect(schoolScope(request)).toEqual({ schoolId: "school-a" });
    expect(scopedIdFilter(request, "record-b")).toEqual({ schoolId: "school-a", _id: "record-b" });
  });

  it("rejects requests without a token-derived school", () => {
    expect(() => schoolScope({ user: undefined } as Request)).toThrow("Authenticated school context is required.");
  });
});