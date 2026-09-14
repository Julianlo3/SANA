import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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