'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Target, Trophy, ShoppingBag, History, Loader2, User, GraduationCap, Puzzle, CalendarDays } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import type { Seller } from '@/lib/types';
import { dataStore, useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { SellerContext } from '@/contexts/SellerContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// --- COMPONENTE CORRIGIDO (Adicionado de volta) ---
const menuItems = [
  {href: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid},
  {href: '/seller/escala', label: 'Minha Escala', icon: CalendarDays},
  {href: '/seller/ofertas', label: 'Ofertas', icon: ShoppingBag},
  {href: '/seller/loja', label: 'Loja de Prémios', icon: ShoppingBag},
  {href: '/seller/ranking', label: 'Meu Desempenho', icon: Trophy},
  {href: '/seller/missions', label: 'Missões', icon: Target},
  {href: '/seller/academia', label: 'Academia', icon: GraduationCap},
  {href: '/seller/quiz', label: 'Quiz', icon: Puzzle},
  {href: '/seller/historico', label: 'Histórico', icon: History},
  {href: '/seller/perfil', label: 'Meu Perfil', icon: User},
];

const SellerSidebarContent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('loggedInSellerId');
    auth.signOut();
    router.push('/login');
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <SidebarHeader className="p-4"><div className="flex items-center gap-3"><Logo /><h1 className="text-xl font-semibold text-white group-data-[collapsible=icon]:hidden">Acelera GT</h1></div></SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => (
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
    </>
  );
};
// --- FIM DA CORREÇÃO ---

export default function SellerLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const state = useStore(s => s);
  const [authStatus, setAuthStatus] = React.useState<{ isLoading: boolean; user: FirebaseUser | null }>({ isLoading: true, user: null });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus({ isLoading: false, user });
      } else {
        setAuthStatus({ isLoading: false, user: null });
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  React.useEffect(() => {
    const sellersCol = collection(db, 'sellers');
    const unsubscribe = onSnapshot(sellersCol, (snapshot) => {
        const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
        dataStore.setSellers(() => sellersFromDb);
    }, (error) => {
        console.error("Erro ao sincronizar vendedores:", error);
    });
    return () => unsubscribe();
  }, []);

  const currentSeller = React.useMemo(() => {
    if (authStatus.isLoading || !authStatus.user) return null;
    return state.sellers.find(s => s.id === authStatus.user!.uid) || null;
  }, [authStatus.isLoading, authStatus.user, state.sellers]);

  const contextValue = React.useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    currentSeller: currentSeller!,
    userId: authStatus.user?.uid || null,
    isAuthReady: !authStatus.isLoading && !!currentSeller,
  }), [state, currentSeller, authStatus]);


  if (authStatus.isLoading || !currentSeller) {
    return (
       <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar hidden md:flex">
                {/* O conteúdo da sidebar não é renderizado aqui para evitar repetição */}
            </Sidebar>
            <DashboardSkeleton />
          </div>
      </SidebarProvider>
    );
  }

  return (
    <SellerContext.Provider value={contextValue as any}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
            <SellerSidebarContent />
          </Sidebar>
          <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center gap-2"><Logo /><h1 className="text-lg font-semibold text-white">Acelera GT</h1></div>
              <SidebarTrigger />
            </header>
            <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </SellerContext.Provider>
  );
}