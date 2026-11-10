import type { Metadata } from "next";
import LegalDocumentPage from "@/features/legal/components/legal-document-page";
import { getPublicPolicyDocument } from "@/features/legal/services/public-policy-service";

export const metadata: Metadata = {
  title: "Términos y condiciones | Fundación Dejando Huellas Felices",
  description:
    "Condiciones de uso de SANA: solicitud de citas, cuenta opcional y donaciones.",
};

export default async function TermsPage() {
  const document = await getPublicPolicyDocument("terms_of_use");

  return (
    <LegalDocumentPage document={document} unavailableTitle="Términos y condiciones" />
  );
}
