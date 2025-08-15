'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';
import { AdminSidebar } from '@/components/AdminSidebar';

const ProtectedAdminLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { isLoading, isAdmin } = useAdminContext();

    React.useEffect(() => {
        // Roda depois que o carregamento inicial (auth + dados) estiver completo
        if (!isLoading) {
            if (!isAdmin) {
                router.push('/login');
            }
        }
    }, [isLoading, isAdmin, router]);

    // Exibe o esqueleto de carregamento enquanto o contexto está a carregar
    if (isLoading) {
        return <DashboardSkeleton />;
    }
    
    // Se não for admin, exibe a skeleton para evitar piscar de conteúdo antes do redirecionamento
    if (!isAdmin) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex flex-1">
             <AdminSidebar />
             <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
                 {children}
             </main>
        </div>
    );
}

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
