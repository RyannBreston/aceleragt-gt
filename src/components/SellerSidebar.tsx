'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Target, ShoppingBag, History, User, CalendarDays, BarChart, Zap, GraduationCap } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { auth } from '@/lib/firebase';
import { SellerProvider, useSellerContext } from '@/contexts/SellerContext';
import { GamificationSettings } from '@/lib/types';

const allMenuItems = [
  {href: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid, key: 'dashboard'},
  {href: '/seller/sprints', label: 'Corridinha Diária', icon: Zap, key: 'sprints'},
  {href: '/seller/escala', label: 'Minha Escala', icon: CalendarDays, key: 'escala'},
  {href: '/seller/ofertas', label: 'Ofertas', icon: ShoppingBag, key: 'ofertas'},
  {href: '/seller/loja', label: 'Loja de Prémios', icon: ShoppingBag, key: 'loja'},
  {href: '/seller/ranking', label: 'Meu Desempenho', icon: BarChart, key: 'ranking'},
  {href: '/seller/missions', label: 'Missões', icon: Target, key: 'missions'},
  {href: '/seller/academia', label: 'Academia', icon: GraduationCap, key: 'academia'},
  {href: '/seller/historico', label: 'Histórico', icon: History, key: 'historico'},
  {href: '/seller/perfil', label: 'Meu Perfil', icon: User, key: 'perfil'},
];

const SellerLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { goals, isAuthReady } = useSellerContext();

  const visibleMenuItems = React.useMemo(() => {
    if (!isAuthReady) return [];
    
    const settings = goals?.gamification as GamificationSettings | undefined;
    if (!settings) {
      return allMenuItems.filter(item => ['/seller/dashboard', '/seller/perfil'].includes(item.href));
    }

    return allMenuItems.filter(item => {
        const itemKey = item.key as keyof GamificationSettings;
        return settings[itemKey];
    });
  }, [goals, isAuthReady]);

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = ()_ => {
    auth.signOut();
    router.push('/login');
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar hidden md:flex">
        <SidebarHeader className="p-4"><div className="flex items-center gap-3"><Logo /><h1 className="text-xl font-semibold text-white group-data-[collapsible=icon]:hidden">Acelera GT</h1></div></SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {visibleMenuItems.map(item => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton onClick={() => handleNavigate(item.href)} isActive={pathname === item.href} className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{ children: item.label }}>
                  <item.icon className="size-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 space-y-4">
          <Button onClick={handleLogout} variant="secondary" className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground">
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2"><Logo /><h1 className="text-lg font-semibold text-white">Acelera GT</h1></div>
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">{children}</main>
      </div>
    </>
  );
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <SellerLayoutContent>
            {children}
          </SellerLayoutContent>
        </div>
      </SidebarProvider>
    </SellerProvider>
  );
}