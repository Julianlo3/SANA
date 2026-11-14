"use client";

import MyRequestsSection from "../components/my-requests-section";
import OwnProfileSection from "../components/own-profile-section";
import MyCarePackagesSection from "@/features/care-packages/components/my-care-packages-section";

/**
 * Unified view for the pure consultant: greeting + appointments + personal data.
 * For employees with double roles, see:
 *   - (staff)/mi-cuenta → only personal appointments
 *   - (staff)/mi-perfil → only personal data
 * @returns The consultant's account sections.
 */
export default function MyAccountPage() {
  return (
    <div className="space-y-10">
      <MyRequestsSection />
      <MyCarePackagesSection />
      <OwnProfileSection />
    </div>
  );
}