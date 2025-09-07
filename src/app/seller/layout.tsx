import { SellerProvider } from "@/contexts/SellerContext";
import SellerSidebar from "@/components/SellerSidebar";
import Header from "@/components/header";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SellerSidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SellerProvider>
  );
}