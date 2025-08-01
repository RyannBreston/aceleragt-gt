'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LayoutGrid, LogOut, Puzzle, Shield, Target, Trophy, ShoppingBag, History, User, CalendarDays } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { auth } from '@/lib/firebase';
// Importa o Provider e o Hook do contexto
import { AdminProvider, useAdminContext } from '@/contexts/AdminContext';

const menuItems = [
    {href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid},
    {href: '/admin/ranking', label: 'Ranking', icon: Trophy},
    {href: '/admin/escala', label: 'Escala de Trabalho', icon: CalendarDays},
    {href: '/admin/missions', label: 'Missões', icon: Target},
    {href: '/admin/academia', label: 'Academia', icon: GraduationCap},
    {href: '/admin/quiz', label: 'Quiz', icon: Puzzle},
    {href: '/admin/loja', label: 'Loja de Prémios', icon: ShoppingBag},
    {href: '/admin/ofertas', label: 'Gestão de Ofertas', icon: ShoppingBag},
    {href: '/admin/historico', label: 'Histórico', icon: History},
    {href: '/admin/perfil', label: 'Perfil', icon: User},
    {href: '/admin/settings', label: 'Configurações', icon: Shield},
];

// Componente de conteúdo que consome o contexto
function AdminLayoutContent({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  // Obtém o estado 'isDirty' diretamente do contexto
  const { isDirty, setIsDirty } = useAdminContext(); 
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);

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
        <SidebarContent><SidebarMenu>{menuItems.map(item => (<SidebarMenuItem key={item.label}><SidebarMenuButton onClick={() => handleNavigate(item.href)} isActive={pathname === item.href} className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{ children: item.label }}><item.icon className="size-5" /><span className="group-data-[collapsible=icon]:hidden">{item.label}</span></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></SidebarContent>
        <SidebarFooter className="p-4 space-y-4"><Button onClick={handleLogout} variant="secondary" className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"><LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" /><span className="group-data-[collapsible=icon]:hidden">Sair</span></Button></SidebarFooter>
      </Sidebar>
      
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2"><Logo /><h1 className="text-lg font-semibold text-white">Acelera GT</h1></div>
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">{children}</main>
      </div>

      <AlertDialog open={!!pendingPath} onOpenChange={() => setPendingPath(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle><AlertDialogDescription>Tem a certeza de que deseja sair? As suas alterações serão perdidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmNavigation}>Sair Mesmo Assim</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Layout principal que envolve tudo com o Provider
export default function AdminLayout({children}: {children: React.ReactNode}) {
  return (
    <AdminProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AdminLayoutContent>
            {children}
          </AdminLayoutContent>
        </div>
      </SidebarProvider>
    </AdminProvider>
  );
}