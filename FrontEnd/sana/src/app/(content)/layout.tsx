import Sidebar from "@/components/navigation/sidebar";
import Header from "@/components/navigation/panel-header";
import { CONTENT_ROLES } from "@/features/content/config/content-access";
import { requireAnyRole } from "@/lib/auth-guard";

export default async function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAnyRole(CONTENT_ROLES);

  return (
    <div className="flex flex-1">
      <Sidebar roles={user.roles} fullName={user.fullName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header fullName={user.fullName} roles={user.roles} />
        <main className="relative flex-1 overflow-y-auto p-4 pt-20 sm:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
