import type { Metadata } from "next";
import NewsManagementPage from "@/features/content/pages/news-management-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Noticias | SANA" };

/**
 * Renders the news management page.
 * @returns Rendered component.
 */
export default function NewsManagement() {
  return <NewsManagementPage />;
}
