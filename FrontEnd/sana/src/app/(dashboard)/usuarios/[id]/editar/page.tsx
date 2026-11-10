import type { Metadata } from "next";
import { requireAdministrator } from "@/lib/auth-guard";
import UserEditPage from "@/features/users/pages/user-edit-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Editar usuario | SANA" };

/**
 * Page for editing a user.
 * @param param0 The route parameters.
 * @returns The user edit page.
 * @param props Component properties.
 */
export default async function EditUser({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdministrator();
  const { id } = await params;

  return <UserEditPage userId={Number(id)} />;
}