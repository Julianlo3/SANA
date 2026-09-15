"use client";
import UserCard from "./user-card";
import UserRow from "./user-row";
import type { User, UserAction } from "../types/user-types";

type Props = {
  users: User[];
  openMenuUserId: number | null;
  onToggleMenu: (userId: number) => void;
  onCloseMenu: () => void;
  onAction: (action: UserAction, user: User) => void;
};

/** A partir de esta posición el menú se abre hacia arriba. */
const UPWARDS_THRESHOLD = 2;

export default function UsersList({
  users,
  openMenuUserId,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  function shouldOpenUpwards(index: number) {
    return users.length > 4 && index >= users.length - UPWARDS_THRESHOLD;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <table className="hidden w-full lg:table">
        <caption className="sr-only">
          Personal de la fundación con acceso a SANA
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs tracking-wide text-text-subtle">
            <th scope="col" className="py-3 pl-5 pr-3 font-medium">
              Usuario
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Correo
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Roles
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Estado
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Última conexión
            </th>
            <th scope="col" className="py-3 pl-3 pr-5">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <UserRow
              key={user.id}
              user={user}
              isMenuOpen={openMenuUserId === user.id}
              openMenuUpwards={shouldOpenUpwards(index)}
              onToggleMenu={() => onToggleMenu(user.id)}
              onCloseMenu={onCloseMenu}
              onAction={onAction}
            />
          ))}
        </tbody>
      </table>

      <ul className="lg:hidden">
        {users.map((user, index) => (
          <UserCard
            key={user.id}
            user={user}
            isMenuOpen={openMenuUserId === user.id}
            openMenuUpwards={shouldOpenUpwards(index)}
            onToggleMenu={() => onToggleMenu(user.id)}
            onCloseMenu={onCloseMenu}
            onAction={onAction}
          />
        ))}
      </ul>
    </div>
  );
}