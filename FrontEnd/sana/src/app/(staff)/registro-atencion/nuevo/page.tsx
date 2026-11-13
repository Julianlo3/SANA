import type { Metadata } from "next";
import { Suspense } from "react";
import RecordCarePage from "@/features/consultants/pages/record-care-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Registrar atención | SANA" };

/**
 * Renders the record care page.
 * @returns Rendered component.
 */
export default function RecordCare() {
  return (
    <Suspense>
      <RecordCarePage />
    </Suspense>
  );
}