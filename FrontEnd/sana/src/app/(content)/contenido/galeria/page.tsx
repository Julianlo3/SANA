import type { Metadata } from "next";
import GalleryManagementPage from "@/features/content/pages/gallery-management-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Galería | SANA" };

/**
 * Renders the gallery management page.
 * @returns Rendered component.
 */
export default function GalleryManagement() {
  return <GalleryManagementPage />;
}
