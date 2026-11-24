// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";
import { MY_REQUESTS_UPDATED_EVENT } from "@/features/my-account/lib/my-requests-events";
import MyRequestsSection from "@/features/my-account/components/my-requests-section";
import type { MyRequest } from "@/features/my-account/types/my-account-types";

const mocks = vi.hoisted(() => ({
  listMyCarePackages: vi.fn(),
  useMyRequests: vi.fn(),
  useOwnProfile: vi.fn(),
}));

vi.mock("@/features/care-packages/services/care-packages-service", () => ({
  listMyCarePackages: mocks.listMyCarePackages,
}));
vi.mock("@/features/my-account/hooks/use-my-requests", () => ({
  useMyRequests: mocks.useMyRequests,
}));
vi.mock("@/features/my-account/hooks/use-own-profile", () => ({
  useOwnProfile: mocks.useOwnProfile,
}));

const profile = {
  fullName: "Ana Ejemplo",
  cardType: "CC",
  identityDocument: "12345678",
  email: "ana@example.com",
  phone: "3001234567",
  birthdate: "1990-01-01",
  gender: "F",
  residenceZone: "Neiva, Huila",
  vulnerabilities: null,
  canEditConsultantFields: true,
};

/**
 * Creates a package fixture for request eligibility tests.
 * @param patientType Package patient type.
 * @param state Package lifecycle state.
 * @returns A care package fixture.
 */
function createPackage(
  patientType: CarePackage["patientType"],
  state: CarePackage["state"],
): CarePackage {
  return {
    id: 1,
    state,
    priority: "media",
    sessionLimit: 6,
    createdAt: "2026-11-17T10:00:00.000Z",
    closedAt: null,
    psychologistId: 7,
    psychologistName: "Psicóloga",
    patientType,
    patientName: "Ana Ejemplo",
    completedSessions: 0,
    reservedSessions: 0,
  };
}

function createRequest(
  appId: number,
  appState: MyRequest["appState"],
  patientType: MyRequest["patientType"],
  patientName: string,
  appDate: string | null,
): MyRequest {
  return {
    appId,
    appState,
    appKind: "valoracion",
    carePackageId: null,
    appType: "virtual",
    appDate,
    appDuration: 60,
    appCreatedAt: `2026-11-${String(appId).padStart(2, "0")}T10:00:00.000Z`,
    patientType,
    patientName,
    psychologistName: null,
  };
}

describe("my requests section package gating", () => {
  beforeEach(() => {
    mocks.useOwnProfile.mockReturnValue({ profile });
    mocks.useMyRequests.mockReturnValue({
      requests: [],
      isLoading: false,
      loadError: null,
      cancelingId: null,
      notice: null,
      actionError: null,
      cancel: vi.fn(),
      reload: vi.fn(),
    });
    mocks.listMyCarePackages.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the self request disabled until package status is verified", () => {
    mocks.listMyCarePackages.mockReturnValue(new Promise<CarePackage[]>(() => {}));

    render(<MyRequestsSection />);

    expect(
      screen
        .getByRole("button", { name: "Solicitar una valoración" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", {
        name: "Solicitar valoración para un dependiente",
      }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("disables self valuation requests while a self package is active", async () => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage("self", "activo"),
    ]);

    render(<MyRequestsSection />);

    const selfRequestButton = screen.getByRole("button", {
      name: "Solicitar una valoración",
    });
    await waitFor(() =>
      expect(selfRequestButton.hasAttribute("disabled")).toBe(true),
    );
    expect(
      screen.getByText(/Tienes un paquete activo/),
    ).toBeTruthy();
  });

  it("keeps self requests enabled when only a dependent package is active", async () => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage("dependent", "activo"),
    ]);

    render(<MyRequestsSection />);

    const selfRequestButton = screen.getByRole("button", {
      name: "Solicitar una valoración",
    });
    await waitFor(() =>
      expect(selfRequestButton.hasAttribute("disabled")).toBe(false),
    );
  });

  it("disables the general self valuation form when a package is finalized", async () => {
    mocks.listMyCarePackages.mockResolvedValue([
      createPackage("self", "finalizado"),
    ]);

    render(<MyRequestsSection />);

    const selfRequestButton = screen.getByRole("button", {
      name: "Solicitar una valoración",
    });
    await waitFor(() =>
      expect(selfRequestButton.hasAttribute("disabled")).toBe(true),
    );
    expect(screen.getByText(/valoración de continuidad/)).toBeTruthy();
  });

  it("keeps self valuation requests disabled when package lookup fails", async () => {
    mocks.listMyCarePackages.mockRejectedValue(new Error("Network error"));

    render(<MyRequestsSection />);

    const selfRequestButton = screen.getByRole("button", {
      name: "Solicitar una valoración",
    });
    await waitFor(() =>
      expect(selfRequestButton.hasAttribute("disabled")).toBe(true),
    );
    expect(screen.getByText(/No pudimos verificar tus paquetes/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("reloads appointments when a package booking emits an update", () => {
    const reload = vi.fn();
    mocks.useMyRequests.mockReturnValue({
      requests: [],
      isLoading: false,
      loadError: null,
      cancelingId: null,
      notice: null,
      actionError: null,
      cancel: vi.fn(),
      reload,
    });

    render(<MyRequestsSection />);
    window.dispatchEvent(new Event(MY_REQUESTS_UPDATED_EVENT));

    expect(reload).toHaveBeenCalledWith("Tus citas se actualizaron.");
  });

  it("prioritizes active appointments and pages them four at a time", () => {
    mocks.useMyRequests.mockReturnValue({
      requests: [
        createRequest(1, "realizada", "self", "Ana Ejemplo", "2025-01-01"),
        createRequest(2, "confirmada", "dependent", "Lucía", "2026-11-20"),
        createRequest(3, "cancelada", "self", "Ana Ejemplo", "2026-10-01"),
        createRequest(4, "pendiente", "dependent", "Lucía", null),
        createRequest(5, "asignada", "dependent", "Mateo", "2026-11-21"),
        createRequest(6, "realizada", "dependent", "Mateo", "2026-11-10"),
      ],
      isLoading: false,
      loadError: null,
      cancelingId: null,
      notice: null,
      actionError: null,
      cancel: vi.fn(),
      reload: vi.fn(),
    });

    render(<MyRequestsSection />);

    const appointmentIds = () =>
      screen.getAllByText(/Solicitud #/).map((element) => element.textContent);
    expect(appointmentIds()).toEqual([
      "Solicitud #4",
      "Solicitud #2",
      "Solicitud #5",
      "Solicitud #6",
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: "Mostrar citas siguientes" }),
    );
    expect(appointmentIds()).toEqual(["Solicitud #3", "Solicitud #1"]);

    fireEvent.click(
      screen.getByRole("button", { name: "Mostrar citas anteriores" }),
    );
    expect(appointmentIds()).toHaveLength(4);
  });

  it("filters appointment cards by dependent name", () => {
    mocks.useMyRequests.mockReturnValue({
      requests: [
        createRequest(1, "confirmada", "self", "Ana Ejemplo", "2026-11-20"),
        createRequest(2, "pendiente", "dependent", "Lucía", null),
        createRequest(3, "realizada", "dependent", "Mateo", "2026-11-10"),
      ],
      isLoading: false,
      loadError: null,
      cancelingId: null,
      notice: null,
      actionError: null,
      cancel: vi.fn(),
      reload: vi.fn(),
    });

    render(<MyRequestsSection />);

    fireEvent.change(screen.getByLabelText("Mostrar citas de"), {
      target: { value: "dependent:Lucía" },
    });

    expect(screen.getAllByText(/Solicitud #/).map((element) => element.textContent)).toEqual([
      "Solicitud #2",
    ]);
  });
});
