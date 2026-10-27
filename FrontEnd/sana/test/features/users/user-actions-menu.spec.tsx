// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserActionsMenu from "@/features/users/components/user-actions-menu";
import UserCard from "@/features/users/components/user-card";
import UserRow from "@/features/users/components/user-row";
import type {
  User,
  UserAction,
  UserStatus,
} from "@/features/users/types/user-types";

const baseUser: User = {
  id: 1,
  fullName: "Ana Ejemplo",
  identityDocument: "12345678",
  email: "ana@example.com",
  contactNumber: "3001234567",
  roles: [{ id: 2, name: "marketing", isActive: true }],
  status: "active",
  lastLoginAt: null,
};

function renderMenu(status: UserStatus) {
  const onSelect = vi.fn<(action: UserAction) => void>();
  render(
    <UserActionsMenu
      user={{ ...baseUser, status }}
      onSelect={onSelect}
      onClose={vi.fn()}
    />,
  );
  return onSelect;
}

describe("user status actions", () => {
  afterEach(() => cleanup());

  it("offers deactivate and archive actions for active users", () => {
    renderMenu("active");

    expect(
      screen.queryByRole("menuitem", { name: "Bloquear acceso" }),
    ).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: "Desactivar cuenta" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("menuitem", { name: "Dar de baja" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("menuitem", { name: "Habilitar cuenta" }),
    ).toBeNull();
  });

  it("does not offer actions for archived users in the regular list", () => {
    renderMenu("blocked");

    expect(
      screen.queryByRole("menuitem", { name: "Desbloquear acceso" }),
    ).toBeNull();
    expect(
      screen.queryByRole("menuitem", { name: "Dar de baja" }),
    ).toBeNull();
  });

  it("offers enable for inactive users", () => {
    const onSelect = renderMenu("inactive");

    fireEvent.click(screen.getByRole("menuitem", { name: "Habilitar cuenta" }));

    expect(onSelect).toHaveBeenCalledWith("enable");
    expect(
      screen.queryByRole("menuitem", { name: "Desbloquear acceso" }),
    ).toBeNull();
  });

  it.each([
    ["blocked", "text-danger", "bg-danger text-white"],
    ["inactive", "text-text-subtle", "bg-surface-muted text-text-subtle"],
  ] as const)(
    "styles %s user identity distinctly in the mobile card",
    (status, nameClass, avatarClass) => {
      const { container } = render(
        <ul>
          <UserCard
            user={{ ...baseUser, status }}
            isMenuOpen={false}
            openMenuUpwards={false}
            onToggleMenu={vi.fn()}
            onCloseMenu={vi.fn()}
            onAction={vi.fn()}
          />
        </ul>,
      );

      expect(screen.getByText("Ana Ejemplo").className).toContain(nameClass);
      expect(container.querySelector("li > span")?.className).toContain(
        avatarClass,
      );
    },
  );

  it.each([
    ["blocked", "text-danger", "bg-danger text-white"],
    ["inactive", "text-text-subtle", "bg-surface-muted text-text-subtle"],
  ] as const)(
    "styles %s user identity distinctly in the desktop row",
    (status, nameClass, avatarClass) => {
      const { container } = render(
        <table>
          <tbody>
            <UserRow
              user={{ ...baseUser, status }}
              isMenuOpen={false}
              openMenuUpwards={false}
              onToggleMenu={vi.fn()}
              onCloseMenu={vi.fn()}
              onAction={vi.fn()}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByText("Ana Ejemplo").className).toContain(nameClass);
      expect(container.querySelector("td span")?.className).toContain(
        avatarClass,
      );
    },
  );
});
