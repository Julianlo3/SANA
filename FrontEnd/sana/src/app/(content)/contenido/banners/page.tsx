import type { Metadata } from "next";
import BannersManagementPage from "@/features/content/pages/banners-management-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Banners | SANA" };

/**
 * Renders the banners management page.
 * @returns Rendered component.
 */
export default function BannersManagement() {
  return <BannersManagementPage />;
}
