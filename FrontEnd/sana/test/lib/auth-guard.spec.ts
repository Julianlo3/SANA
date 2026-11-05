import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mocks for testing purposes.
 */
const mocks = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<{ user: { name: string } } | null>>(),
  getAccessToken: vi.fn<() => Promise<{ token: string }>>(),
  redirect: vi.fn<(path: string) => never>((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

/**
 * Mocks the auth0 module and the next/navigation module for testing purposes.
 */
vi.mock("../../src/lib/auth0", () => ({
  auth0: {
    getSession: mocks.getSession,
    getAccessToken: mocks.getAccessToken,
  },
}));

/**
 * Mocks the next/navigation module for testing purposes.
 */
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

// Importa la función getCurrentUser después de configurar los mocks
import { getCurrentUser } from "../../src/lib/auth-guard";

/**
 * Tests for the getCurrentUser function, focusing on backend availability and error handling.
 */
describe("getCurrentUser backend availability", () => {
  beforeEach(() => {
    mocks.getSession.mockResolvedValue({ user: { name: "Test User" } });
    mocks.getAccessToken.mockResolvedValue({ token: "test-token" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("redirects to a friendly status page when the backend cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(getCurrentUser()).rejects.toThrow(
      "NEXT_REDIRECT:/servicio-no-disponible",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/servicio-no-disponible");
  });

  it("redirects to a friendly status page when the backend returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    await expect(getCurrentUser()).rejects.toThrow(
      "NEXT_REDIRECT:/servicio-no-disponible",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/servicio-no-disponible");
  });
});
