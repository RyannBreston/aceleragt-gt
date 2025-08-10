import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AdminProvider } from "@/contexts/AdminContext";
import { SellerProvider } from "@/contexts/SellerContext";
import "./globals.css";
import "./animated-background.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acelera GT",
  description: "Plataforma de gamificação para equipas de vendas.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/images (1).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Acelera GT" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Acelera GT" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
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
