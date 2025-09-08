// app/admin/layout.tsx
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";
import AdminNavbar from "./components/AdminNavbar";

// Define a interface para as props do layout
interface AdminLayoutProps {
  children: ReactNode;
}

// O componente de layout deve ser um Client Component se usar contexts
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    // Usar AdminProvider ao invés de SellerProvider para o contexto admin
    <AdminProvider>
      <div className="flex min-h-screen w-full flex-col items-center">
        <AdminNavbar />
        <div className="w-full p-2 md:p-14">{children}</div>
        <Toaster />
      </div>
    </AdminProvider>
  );
}