// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUserCreateForm } from "@/features/users/hooks/use-user-create-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/users/services/users-service", () => ({
  createUser: vi.fn(),
}));

describe("useUserCreateForm role selection", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("allows one role to be selected, replaced, and cleared", () => {
    const { result } = renderHook(() => useUserCreateForm());

    act(() => result.current.toggleRole(4));
    expect(result.current.values.roleIds).toEqual([4]);

    act(() => result.current.toggleRole(1));
    expect(result.current.values.roleIds).toEqual([1]);

    act(() => result.current.toggleRole(1));
    expect(result.current.values.roleIds).toEqual([]);
  });
});
