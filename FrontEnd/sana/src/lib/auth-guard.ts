import { redirect } from "next/navigation";
import { auth0 } from "./auth0";

export type CurrentUser = {
  userId: number;
  personId: number;
  email: string;
  roles: string[];
  auth0Subject: string;
  state: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const accessToken = await auth0.getAccessToken();
  if (!accessToken?.token) redirect("/session-expired");

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      Origin: process.env.APP_BASE_URL ?? "http://localhost:5173",
    },
    cache: "no-store",
  });

  if (response.status === 401) redirect("/session-expired");
  if (response.status === 403) redirect("/restricted-access");
  if (!response.ok) throw new Error("No se pudo validar la autorización local.");

  return (await response.json()) as CurrentUser;
}

export async function requireAdministrator(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (user.roles.length === 0) redirect("/pending-account");
  if (!user.roles.includes("administrador")) redirect("/restricted-access");

  return user;
}