// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";
import MyCarePackagesSection from "@/features/care-packages/components/my-care-packages-section";

const mocks = vi.hoisted(() => ({
  listMyCarePackages: vi.fn(),
  listMyRequests: vi.fn(),
}));

vi.mock("@/features/care-packages/services/care-packages-service", () => ({
  listMyCarePackages: mocks.listMyCarePackages,
}));
vi.mock("@/features/my-account/services/my-account-service", () => ({
  listMyRequests: mocks.listMyRequests,
}));

function createPackage(
  id: number,
  state: CarePackage["state"],
): CarePackage {
  return {
    id,
    state,
    priority: "media",
    sessionLimit: 6,
    createdAt: "2026-11-17T10:00:00.000Z",
    closedAt: null,
    psychologistId: 7,
    psychologistName: "Psicóloga",
    patientType: "self",
    patientName: "Ana Ejemplo",
    completedSessions: state === "activo" ? 6 : 0,
    reservedSessions: 0,
  };
}

describe("my care packages section", () => {
  beforeEach(() => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage(1, "activo"),
      createPackage(2, "sugerido"),
    ]);
    mocks.listMyRequests.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows active packages first and keeps other states in a collapsible list", async () => {
    render(<MyCarePackagesSection />);

    await waitFor(() =>
      expect(screen.getByText("Paquete #1")).toBeTruthy(),
    );
    expect(
      screen.getByRole("heading", { name: "Paquetes activos" }),
    ).toBeTruthy();

    const otherPackagesSummary = screen.getByText("Otros paquetes (1)");
    const otherPackagesDisclosure = otherPackagesSummary.closest("details");
    expect(otherPackagesDisclosure?.open).toBe(false);

    fireEvent.click(otherPackagesSummary);

    expect(otherPackagesDisclosure?.open).toBe(true);
    expect(screen.getByText("Paquete #2")).toBeTruthy();
    expect(screen.getByText("Pendiente de aprobación")).toBeTruthy();
  });

  it("offers a follow-up valuation from an eligible finalized package", async () => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage(1, "finalizado"),
    ]);

    render(<MyCarePackagesSection />);
    await waitFor(() =>
      expect(screen.getByText("Otros paquetes (1)")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Otros paquetes (1)"));

    expect(
      screen.getByRole("button", { name: "Solicitar nueva valoración" }),
    ).toBeTruthy();
  });

  it("does not offer follow-up for a patient with another active package", async () => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage(1, "activo"),
      createPackage(2, "finalizado"),
    ]);

    render(<MyCarePackagesSection />);
    await waitFor(() =>
      expect(screen.getByText("Paquete #1")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Otros paquetes (1)"));

    expect(
      screen.queryByRole("button", { name: "Solicitar nueva valoración" }),
    ).toBeNull();
    expect(screen.getByText(/tiene un paquete activo/)).toBeTruthy();
  });
});
