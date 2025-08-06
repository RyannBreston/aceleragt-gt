'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Target, Trophy, ShoppingBag, History, User, GraduationCap, Puzzle, CalendarDays, BarChart } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { auth } from '@/lib/firebase';
import { SellerProvider, useSellerContext } from '@/contexts/SellerContext';

// Lista completa de todos os menus possíveis para o vendedor
const allMenuItems = [
  {href: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid},
  {href: '/seller/escala', label: 'Minha Escala', icon: CalendarDays},
  {href: '/seller/ofertas', label: 'Ofertas', icon: ShoppingBag, key: 'ofertas'},
  {href: '/seller/loja', label: 'Loja de Prémios', icon: ShoppingBag, key: 'loja'},
  {href: '/seller/ranking', label: 'Meu Desempenho', icon: BarChart, key: 'ranking'},
  {href: '/seller/missions', label: 'Missões', icon: Target, key: 'missions'},
  {href: '/seller/academia', label: 'Academia', icon: GraduationCap, key: 'academia'},
  {href: '/seller/quiz', label: 'Quiz', icon: Puzzle, key: 'quiz'},
  {href: '/seller/historico', label: 'Histórico', icon: History},
  {href: '/seller/perfil', label: 'Meu Perfil', icon: User},
];

const SellerLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { goals } = useSellerContext(); // Obtém as configurações do contexto

  // ✅ A LÓGICA DE FILTRAGEM ESTÁ AQUI (E DEVE FICAR AQUI)
  const visibleMenuItems = React.useMemo(() => {
      const gamificationSettings = goals?.gamification;
      if (!gamificationSettings) return allMenuItems;

      return allMenuItems.filter(item => {
          if (!item.key || !gamificationSettings.hasOwnProperty(item.key)) {
              return true;
          }
          return gamificationSettings[item.key as keyof typeof gamificationSettings];
      });
  }, [goals]);

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = () => {
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