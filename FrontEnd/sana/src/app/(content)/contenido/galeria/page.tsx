import type { Metadata } from "next";
import GalleryManagementPage from "@/features/content/pages/gallery-management-page";

export const metadata: Metadata = { title: "Galería | SANA" };

export default function GalleryManagement() {
  return <GalleryManagementPage />;
}
