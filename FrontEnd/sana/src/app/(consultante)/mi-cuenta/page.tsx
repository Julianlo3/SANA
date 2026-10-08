import type { Metadata } from "next";
import MyAccountPage from "@/features/my-account/pages/my-account-page";

export const metadata: Metadata = { title: "Mi cuenta | SANA" };

export default function MyAccount() {
  return <MyAccountPage />;
}