// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserEditForm } from "@/features/users/hooks/use-user-edit-form";
import {
  getUserById,
  updateUser,
} from "@/features/users/services/users-service";
import type { User } from "@/features/users/types/user-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/users/services/users-service", () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

const user: User = {
  id: 12,
  fullName: "Ana Ejemplo",
  identityDocument: "12345678",
  email: "ana@example.com",
  contactNumber: "3001234567",
  roles: [
    { id: 2, name: "marketing", isActive: true },
    { id: 4, name: "secretario", isActive: true },
    { id: 3, name: "consultante", isActive: true },
  ],
  status: "active",
  lastLoginAt: null,
};

describe("useUserEditForm role updates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUserById).mockResolvedValue(user);
    vi.mocked(updateUser).mockResolvedValue(user);
  });

  afterEach(() => cleanup());

  it("sends the selected role set so unchecked roles are revoked", async () => {
    const { result } = renderHook(() => useUserEditForm(user.id));
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => {
      result.current.toggleEditing(true);
      result.current.toggleRole(4);
    });
    await act(async () => {
      await result.current.save();
    });

    expect(updateUser).toHaveBeenCalledWith(user.id, {
      roles: [{ id: 2, isActive: true }],
    });
  });

  it("sends inactive role flags so assigned roles can be disabled", async () => {
    const { result } = renderHook(() => useUserEditForm(user.id));
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => {
      result.current.toggleEditing(true);
      result.current.toggleRoleActive(4);
    });
    await act(async () => {
      await result.current.save();
    });

    expect(updateUser).toHaveBeenCalledWith(user.id, {
      roles: [
        { id: 2, isActive: true },
        { id: 4, isActive: false },
      ],
    });
  });

  it("does not submit or revoke the consultant role while editing employee roles", async () => {
    const { result } = renderHook(() => useUserEditForm(user.id));
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => {
      result.current.toggleEditing(true);
      result.current.toggleRoleActive(2);
    });
    await act(async () => {
      await result.current.save();
    });

    expect(updateUser).toHaveBeenCalledWith(user.id, {
      roles: [
        { id: 2, isActive: false },
        { id: 4, isActive: true },
      ],
    });
  });
});
