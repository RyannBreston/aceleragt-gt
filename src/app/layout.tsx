import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

// Este ficheiro é um Componente de Servidor e não deve conter "use client".
export const metadata: Metadata = {
  title: 'Portal do colaborador SuperModa',
  description: 'Plataforma de gamificação para equipas de vendas.',
  manifest: '/manifest.json', // Garante que o PWA seja reconhecido
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}