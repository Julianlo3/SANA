import { describe, expect, it } from "vitest";
import {
  validateAppointmentMode,
} from "../../../src/features/consultation-requests/validation/consultation-request-validation";

describe("public appointment mode validation", () => {
  it("allows in-person appointments for Huila residents", () => {
    expect(validateAppointmentMode("presencial", "Huila")).toBeUndefined();
  });

  it("allows Huila department names regardless of case and surrounding spaces", () => {
    expect(validateAppointmentMode("presencial", "  HUILA ")).toBeUndefined();
  });

  it("preserves in-person mode when no department rule is supplied", () => {
    expect(validateAppointmentMode("presencial")).toBeUndefined();
  });

  it("rejects in-person appointments outside Huila", () => {
    expect(validateAppointmentMode("presencial", "Tolima")).toContain(
      "solo está disponible",
    );
  });

  it("rejects in-person appointments when no department is selected", () => {
    expect(validateAppointmentMode("presencial", "")).toContain(
      "solo está disponible",
    );
  });

  it("allows virtual appointments outside Huila", () => {
    expect(validateAppointmentMode("virtual", "Tolima")).toBeUndefined();
  });
});
