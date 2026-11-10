import type { Metadata } from "next";
import LegalDocumentPage from "@/features/legal/components/legal-document-page";
import { getPublicPolicyDocument } from "@/features/legal/services/public-policy-service";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos Personales | Fundación Dejando Huellas Felices",
  description:
    "Cómo la Fundación Dejando Huellas Felices recoge, usa y protege los datos personales en SANA.",
};

export default async function PrivacyPolicyPage() {
  const document = await getPublicPolicyDocument("privacy_policy");

  return (
    <LegalDocumentPage
      document={document}
      unavailableTitle="Política de Tratamiento de Datos Personales"
    />
  );
}
