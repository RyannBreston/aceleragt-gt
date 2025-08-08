'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Puzzle, Shield, Target, Trophy, ShoppingBag, History, User, CalendarDays, Zap } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { auth } from '@/lib/firebase';
import { useAdminContext } from '@/contexts/AdminContext';
import { GamificationSettings } from '@/lib/types';

const allMenuItems = [
    {href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid, key: 'dashboard'},
    {href: '/admin/ranking', label: 'Ranking', icon: Trophy, key: 'ranking'},
    {href: '/admin/escala', label: 'Escala de Trabalho', icon: CalendarDays, key: 'escala'},
    {href: '/admin/sprints', label: 'Corridinhas Diárias', icon: Zap, key: 'sprints'}, 
    {href: '/admin/missions', label: 'Missões', icon: Target, key: 'missions'},
    {href: '/admin/quiz', label: 'Quiz', icon: Puzzle, key: 'quiz'},
    {href: '/admin/loja', label: 'Loja de Prémios', icon: ShoppingBag, key: 'loja'},
    {href: '/admin/ofertas', label: 'Gestão de Ofertas', icon: ShoppingBag, key: 'ofertas'},
    {href: '/admin/historico', label: 'Histórico', icon: History, key: 'historico'},
    {href: '/admin/perfil', label: 'Perfil', icon: User, key: 'perfil'},
    {href: '/admin/settings', label: 'Configurações', icon: Shield, key: 'settings'},
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { isDirty, setIsDirty, goals } = useAdminContext(); 
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);

  const visibleMenuItems = React.useMemo(() => {
      const settings = goals?.gamification as GamificationSettings | undefined;
      if (!settings) return allMenuItems;

      return allMenuItems.filter(item => {
          const itemKey = item.key as keyof GamificationSettings;
          return settings[itemKey];
      });
  }, [goals]);

  const handleNavigate = (path: string) => {
    if (pathname.includes('/admin/settings') && isDirty) {
      setPendingPath(path);
    } else {
      router.push(path);
      if (isMobile) setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    const logoutPath = '/login';
    if (pathname.includes('/admin/settings') && isDirty) {
      setPendingPath(logoutPath);
    } else {
      auth.signOut();
      router.push(logoutPath);
    }
    if (isMobile) setOpenMobile(false);
  };

  const handleConfirmNavigation = () => {
    if (pendingPath) {
      setIsDirty(false);
      if (pendingPath === '/login') auth.signOut();
      router.push(pendingPath);
      setPendingPath(null);
      if (isMobile) setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar hidden md:flex">
        <SidebarHeader className="p-4"><div className="flex items-center gap-3"><Logo /><h1 className="text-xl font-semibold text-white group-data-[collapsible=icon]:hidden">Acelera GT</h1></div></SidebarHeader>
        <SidebarContent><SidebarMenu>
            {visibleMenuItems.map(item => (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton onClick={() => handleNavigate(item.href)} isActive={pathname === item.href} className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{ children: item.label }}>
                        <item.icon className="size-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu></SidebarContent>
        <SidebarFooter className="p-4 space-y-4">
            <Button onClick={handleLogout} variant="secondary" className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground">
                <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
             <div className="text-center text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                Versão {process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
        </SidebarFooter>
      </Sidebar>
       
      <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2"><Logo /><h1 className="text-lg font-semibold text-white">Acelera GT</h1></div>
        <SidebarTrigger />
      </header>

      <AlertDialog open={!!pendingPath} onOpenChange={() => setPendingPath(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle><AlertDialogDescription>Tem a certeza de que deseja sair? As suas alterações serão perdidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmNavigation}>Sair Mesmo Assim</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}