import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";

/** First matching role wins, so a user with several roles lands on the broadest screen. */
const HOME_BY_ROLE: [role: string, path: string][] = [
  ["administrador", "/users"],
  ["secretario", "/consultants"],
  ["psicologo", "/consultants"],
  ["marketing", "/content/institutional"],
];

/** Landing route after sign-in: sends each user to the first screen their role can open. */
export default async function Dashboard() {
  const user = await getCurrentUser();

  if (user.roles.length === 0) redirect("/pending-account");

  const home = HOME_BY_ROLE.find(([role]) => user.roles.includes(role));
  redirect(home ? home[1] : "/restricted-access");
}
