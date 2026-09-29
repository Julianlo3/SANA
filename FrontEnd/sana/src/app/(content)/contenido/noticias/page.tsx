import type { Metadata } from "next";
import NewsManagementPage from "@/features/content/pages/news-management-page";

export const metadata: Metadata = { title: "Noticias | SANA" };

export default function NewsManagement() {
  return <NewsManagementPage />;
}
