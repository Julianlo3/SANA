import { describe, expect, it } from "vitest";
import { getFollowUpValuationRestriction } from "@/features/care-packages/lib/follow-up-valuation-eligibility";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";
import type { MyRequest } from "@/features/my-account/types/my-account-types";

function createPackage(
  overrides: Partial<CarePackage> = {},
): CarePackage {
  return {
    id: 1,
    state: "finalizado",
    priority: "media",
    sessionLimit: 6,
    createdAt: "2026-01-01T10:00:00.000Z",
    closedAt: "2026-10-01T10:00:00.000Z",
    psychologistId: 9,
    psychologistName: "Dra. Laura",
    patientType: "dependent",
    patientName: "Lucía Ejemplo",
    completedSessions: 6,
    reservedSessions: 0,
    ...overrides,
  };
}

function createRequest(
  overrides: Partial<MyRequest> = {},
): MyRequest {
  return {
    appId: 9,
    appState: "realizada",
    appKind: "valoracion",
    carePackageId: null,
    appType: "virtual",
    appDate: "2026-10-01T10:00:00.000Z",
    appDuration: 60,
    appCreatedAt: "2026-01-01T10:00:00.000Z",
    patientType: "dependent",
    patientName: "Lucía Ejemplo",
    psychologistName: "Dra. Laura",
    ...overrides,
  };
}

describe("follow-up valuation eligibility", () => {
  it("allows the latest finalized package when the patient has no open valuation", () => {
    const carePackage = createPackage();

    expect(
      getFollowUpValuationRestriction(carePackage, [carePackage], [
        createRequest(),
      ]),
    ).toBeNull();
  });

  it.each([
    ["active package", createPackage({ id: 2, state: "activo" })],
    ["pending suggestion", createPackage({ id: 2, state: "sugerido" })],
    [
      "newer finalized package",
      createPackage({ id: 2, createdAt: "2026-11-01T10:00:00.000Z" }),
    ],
  ])("blocks follow-up when the patient has a %s", (_label, conflictingPackage) => {
    const carePackage = createPackage();

    expect(
      getFollowUpValuationRestriction(
        carePackage,
        [carePackage, conflictingPackage],
        [],
      ),
    ).not.toBeNull();
  });

  it.each(["pendiente", "asignada", "confirmada", "remitida"] as const)(
    "blocks follow-up when a valuation is %s",
    (appState) => {
      const carePackage = createPackage();

      expect(
        getFollowUpValuationRestriction(carePackage, [carePackage], [
          createRequest({ appState }),
        ]),
      ).toContain("valoración en curso");
    },
  );
});
