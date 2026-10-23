// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUsersList } from "@/features/users/hooks/use-users-list";
import {
  changeUserStatus,
  deleteUser,
  getUsers,
} from "@/features/users/services/users-service";
import type { User, UserAction } from "@/features/users/types/user-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/users/services/users-service", () => ({
  changeUserStatus: vi.fn(),
  deleteUser: vi.fn(),
  getUsers: vi.fn(),
}));

const user: User = {
  id: 42,
  fullName: "Ana Ejemplo",
  identityDocument: "12345678",
  email: "ana@example.com",
  contactNumber: "3001234567",
  roles: [{ id: 2, name: "marketing", isActive: true }],
  status: "inactive",
  lastLoginAt: null,
};

describe("useUsersList account enable actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUsers).mockResolvedValue([user]);
    vi.mocked(changeUserStatus).mockResolvedValue();
    vi.mocked(deleteUser).mockResolvedValue();
  });

  afterEach(() => cleanup());

  it("sets an inactive account to active when enabled", async () => {
    const action: UserAction = "enable";
    const { result } = renderHook(() => useUsersList());
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    act(() => result.current.startAction(action, user));
    await act(async () => {
      await result.current.confirmAction();
    });

    expect(changeUserStatus).toHaveBeenCalledWith(user.id, "active", undefined);
    expect(result.current.users[0].status).toBe("active");
  });
});
