import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AdminProvider } from "@/contexts/AdminContext";
import { SellerProvider } from "@/contexts/SellerContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acelera GT",
  description: "Plataforma de gamificação para equipas de vendas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AdminProvider>
          <SellerProvider>
            {children}
            <Toaster />
          </SellerProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
