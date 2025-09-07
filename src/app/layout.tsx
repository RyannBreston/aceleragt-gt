import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/Providers"; // Importa o novo provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acelera GT",
  description: "Plataforma de gamificação para vendedores da SuperModa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers> {/* Envolve todo o app com o SessionProvider */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}