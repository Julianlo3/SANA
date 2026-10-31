import type { Metadata } from "next";
import MyRequestsSection from "@/features/my-account/components/my-requests-section";

export const metadata: Metadata = {
  title: "Mis citas personales | SANA",
};

/**
 * Page for viewing the authenticated user's appointments.
 * Accessible to any staff member who also has a consultant role.
 * Displays only the user's personal appointments.
 * @returns The user's appointments page.
 */
export default function StaffMyAppointmentsPage() {
  return (
    <div className="space-y-10">
      <MyRequestsSection />
    </div>
  );
}
