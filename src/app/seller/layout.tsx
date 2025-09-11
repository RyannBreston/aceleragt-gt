import { SellerProvider } from "@/contexts/SellerContext";
import SellerSidebar from "@/components/SellerSidebar";
import Header from "@/components/header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

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
          <PageHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto w-full">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SellerProvider>
  );
}