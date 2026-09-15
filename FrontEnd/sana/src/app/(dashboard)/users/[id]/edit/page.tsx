import type { Metadata } from "next";
import UserEditPage from "@/features/users/pages/user-edit-page";

export const metadata: Metadata = { title: "Editar usuario | SANA" };

export default async function EditUser({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserEditPage userId={Number(id)} />;
}