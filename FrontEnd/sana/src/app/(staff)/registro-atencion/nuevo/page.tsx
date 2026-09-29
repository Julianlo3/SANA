import type { Metadata } from "next";
import { Suspense } from "react";
import RecordCarePage from "@/features/consultants/pages/record-care-page";

export const metadata: Metadata = { title: "Registrar atención | SANA" };

export default function RecordCare() {
  return (
    <Suspense>
      <RecordCarePage />
    </Suspense>
  );
}