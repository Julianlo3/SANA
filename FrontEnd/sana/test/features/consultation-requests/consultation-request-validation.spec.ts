import { describe, expect, it } from "vitest";
import { getDepartmentFromResidenceZone } from "../../../src/config/residence-zones";
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

describe("account residence-based appointment mode validation", () => {
  it("extracts Huila from the stored municipality and department", () => {
    const department = getDepartmentFromResidenceZone("Neiva, Huila");

    expect(department).toBe("Huila");
    expect(validateAppointmentMode("presencial", department)).toBeUndefined();
  });

  it("rejects in-person appointments when the stored residence is outside Huila", () => {
    const department = getDepartmentFromResidenceZone("Ibagué, Tolima");

    expect(validateAppointmentMode("presencial", department)).toContain(
      "solo está disponible",
    );
  });

  it("does not allow in-person appointments when the profile has no department", () => {
    const department = getDepartmentFromResidenceZone(null);

    expect(validateAppointmentMode("presencial", department)).toContain(
      "solo está disponible",
    );
  });
});
