import { AdminProvider } from "@/contexts/AdminContext";
import AdminSidebar from "@/components/AdminSidebar";
import Header from "@/components/header"; // Corrigido: 'header' com 'h' minúsculo

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}