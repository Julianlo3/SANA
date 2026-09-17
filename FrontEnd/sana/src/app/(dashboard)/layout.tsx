import Sidebar from "@/components/navigation/sidebar";
import Header from "@/components/navigation/panel-header";
import { requireAdministrator } from "@/lib/auth-guard";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdministrator();

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="relative flex-1 overflow-y-auto p-4 pt-20 sm:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}