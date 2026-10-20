import type { Metadata } from "next";
import OwnProfileSection from "@/features/my-account/components/own-profile-section";

export const metadata: Metadata = {
  title: "Mi perfil | SANA",
};

/**
 * Page for viewing and editing the authenticated user's own profile.
 * Accessible to any staff member (secretary, psychologist, administrator,
 * marketing) without needing to be a consultant.
 * Displays only the user's editable personal data.
 * @returns The user's profile page.
 */
export default function StaffProfilePage() {
  return (
    <div className="space-y-10">
      <OwnProfileSection />
    </div>
  );
}
