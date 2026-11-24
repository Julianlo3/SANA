import { describe, expect, it } from "vitest";
import {
  hasActiveSelfCarePackage,
  hasSelfPackageRequiringPackageFlow,
} from "@/features/my-account/lib/appointment-request-eligibility";

describe("appointment request eligibility", () => {
  it("blocks a self valuation when the requester has an active package", () => {
    expect(
      hasActiveSelfCarePackage([{ patientType: "self", state: "activo" }]),
    ).toBe(true);
  });

  it("does not treat a dependent package as the requester's package", () => {
    expect(
      hasActiveSelfCarePackage([
        { patientType: "dependent", state: "activo" },
      ]),
    ).toBe(false);
  });

  it("allows a self valuation when no self package is active", () => {
    expect(
      hasActiveSelfCarePackage([
        { patientType: "self", state: "finalizado" },
        { patientType: "self", state: "sugerido" },
      ]),
    ).toBe(false);
  });

  it("requires the package flow instead of a general valuation after finalization", () => {
    expect(
      hasSelfPackageRequiringPackageFlow([
        { patientType: "self", state: "finalizado" },
      ]),
    ).toBe(true);
    expect(
      hasSelfPackageRequiringPackageFlow([
        { patientType: "dependent", state: "activo" },
      ]),
    ).toBe(false);
  });
});
