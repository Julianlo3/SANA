import type { Metadata } from "next";
import MyAccountPage from "@/features/my-account/pages/my-account-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Mi cuenta | SANA" };

/**
 * Renders the my account page.
 * @returns Rendered component.
 */
export default function MyAccount() {
  return <MyAccountPage />;
}