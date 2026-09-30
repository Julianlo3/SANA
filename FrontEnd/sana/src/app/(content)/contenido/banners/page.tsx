import type { Metadata } from "next";
import BannersManagementPage from "@/features/content/pages/banners-management-page";

export const metadata: Metadata = { title: "Banners | SANA" };

export default function BannersManagement() {
  return <BannersManagementPage />;
}
