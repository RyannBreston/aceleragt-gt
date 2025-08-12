'use client';

import * as React from 'react';
import SellerLayout from '@/components/SellerSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SellerProvider } from '@/contexts/SellerContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SellerProvider>
      <SidebarProvider>
        <SellerLayout>
          {children}
        </SellerLayout>
      </SidebarProvider>
    </SellerProvider>
  );
}
