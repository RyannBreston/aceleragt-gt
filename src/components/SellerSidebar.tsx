'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Target, ShoppingBag, History, User, GraduationCap, Puzzle, CalendarDays, BarChart, Zap, Loader2 } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { auth } from '@/lib/firebase';
import { useSellerContext } from '@/contexts/SellerContext';
import type { GamificationSettings } from '@/lib/types';

// Lista completa de menus
const allMenuItems = [
  {href: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid, key: 'dashboard'},
  {href: '/seller/sprints', label: 'Corridinha Diária', icon: Zap, key: 'sprints'},
  {href: '/seller/escala', label: 'Minha Escala', icon: CalendarDays, key: 'escala'},
  {href: '/seller/ofertas', label: 'Ofertas', icon: ShoppingBag, key: 'ofertas'},
  {href: '/seller/loja', label: 'Loja de Prémios', icon: ShoppingBag, key: 'loja'},
  {href: '/seller/ranking', label: 'Meu Desempenho', icon: BarChart, key: 'ranking'},
  {href: '/seller/missions', label: 'Missões', icon: Target, key: 'missions'},
  {href: '/seller/academia', label: 'Academia', icon: GraduationCap, key: 'academia'},
  {href: '/seller/quiz', label: 'Quiz', icon: Puzzle, key: 'quiz'},
  {href: '/seller/historico', label: 'Histórico', icon: History, key: 'historico'},
  {href: '/seller/perfil', label: 'Meu Perfil', icon: User, key: 'perfil'},
];

export const SellerSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { goals, isAuthReady } = useSellerContext(); // Usando isAuthReady

  const visibleMenuItems = React.useMemo(() => {
      // Se a autenticação ainda não está pronta, não mostre nada ou um loader.
      // Neste caso, retornamos um array vazio para não renderizar os itens do menu.
      if (!isAuthReady) {
          return [];
      }
      
      const settings = goals?.gamification as GamificationSettings | undefined;
      
      // Se as configurações não estiverem carregadas (mas a autenticação sim), mostra itens essenciais.
      if (!settings) {
          return allMenuItems.filter(item => ['/seller/dashboard', '/seller/perfil'].includes(item.href));
      }

      // Se a autenticação e as configurações estão prontas, filtra os itens do menu.
      return allMenuItems.filter(item => {
          const itemKey = item.key as keyof GamificationSettings;
          return settings[itemKey];
      });
  }, [goals, isAuthReady]);

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
    if (isMobile) setOpenMobile(false);
  };
  
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0';

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar hidden md:flex">
        <SidebarHeader className="p-4"><div className="flex items-center gap-3"><Logo /><h1 className="text-xl font-semibold text-white group-data-[collapsible=icon]:hidden">Acelera GT</h1></div></SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {!isAuthReady ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-white" />
                </div>
            ) : (
                visibleMenuItems.map(item => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton onClick={() => handleNavigate(item.href)} isActive={pathname === item.href} className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{ children: item.label }}>
                      <item.icon className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 space-y-4">
            <Button onClick={handleLogout} variant="secondary" className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground">
                <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
            <div className="text-center text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                Versão {appVersion}
            </div>
        </SidebarFooter>
      </Sidebar>
      
      <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2"><Logo /><h1 className="text-lg font-semibold text-white">Acelera GT</h1></div>
        <SidebarTrigger />
      </header>
    </>
  );
};