'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';
import { AdminSidebar } from '@/components/AdminSidebar';

/**
 * Este componente atua como um "portão de segurança".
 * Ele consome o contexto e decide o que renderizar.
 */
const ProtectedAdminLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { isAuthReady, isAdmin } = useAdminContext();

    // ✅ CORREÇÃO APLICADA AQUI:
    // O useEffect é sempre chamado, mas a lógica de redirecionamento
    // só é executada se as condições forem cumpridas.
    React.useEffect(() => {
        // Só fazemos algo depois de a verificação de autenticação estar completa.
        if (isAuthReady) {
            // Se a verificação terminou e o utilizador NÃO é um admin, redirecione.
            if (!isAdmin) {
                router.push('/login');
            }
        }
    }, [isAuthReady, isAdmin, router]); // Dependências do useEffect

    // 1. Enquanto o Firebase verifica o utilizador, ou se não for admin, mostre um ecrã de carregamento.
    // Esta verificação agora é segura.
    if (!isAuthReady || !isAdmin) {
        return <DashboardSkeleton />;
    }

    // 2. Se a verificação terminou e o utilizador É um admin, mostre o conteúdo.
    return (
        <div className="flex flex-1">
             <AdminSidebar />
             <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
                 {children}
             </main>
        </div>
    );
}

/**
 * O Layout principal agora tem uma única função: envolver tudo com os Providers corretos.
 */
export default function AdminLayout({children}: {children: React.ReactNode}) {
  return (
    <AdminProvider>
        <SidebarProvider>
            <div className="flex min-h-screen">
                <ProtectedAdminLayout>
                    {children}
                </ProtectedAdminLayout>
            </div>
        </SidebarProvider>
    </AdminProvider>
  );
}
