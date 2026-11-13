import type { Metadata } from "next";
import { requireAdministrator } from "@/lib/auth-guard";
import UserCreatePage from "@/features/users/pages/user-create-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Crear usuario | SANA" };

/**
 * Page for creating a new user.
 * @returns The user create page.
 */
export default async function NewUser() {
  await requireAdministrator();
  return <UserCreatePage />;
}