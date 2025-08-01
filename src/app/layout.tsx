import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

// O objeto 'metadata' já lida com a inclusão do manifesto.
// A linha 'manifest: "/manifest.json"' está correta aqui.
export const metadata: Metadata = {
  title: 'Portal do colaborador SuperModa',
  description: 'Plataforma de gamificação para equipas de vendas.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      {/* A tag <head> é automaticamente gerenciada pelo Next.js. 
        O objeto 'metadata' acima insere as informações corretas nela, 
        incluindo o link para o manifest.json. Você não precisa adicionar a tag <link> manualmente aqui.
      */}
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}