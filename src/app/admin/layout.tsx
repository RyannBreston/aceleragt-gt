'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';
import { AdminSidebar } from '@/components/AdminSidebar';

const ProtectedAdminLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { isAuthReady, isAdmin } = useAdminContext();

    React.useEffect(() => {
        if (isAuthReady) {
            if (!isAdmin) {
                router.push('/login');
            }
        }
    }, [isAuthReady, isAdmin, router]);

    if (!isAuthReady || !isAdmin) {
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
