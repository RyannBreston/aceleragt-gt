'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LayoutGrid, LogOut, Puzzle, Shield, Target, Trophy, ShoppingBag, History, Loader2, User, CalendarDays } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import type { Admin, Goals, Mission, Seller, CycleSnapshot } from '@/lib/types';
import { dataStore, useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AdminContext, useAdminContext } from '@/contexts/AdminContext';

const menuItems = [
  {href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid},
  {href: '/admin/ranking', label: 'Ranking', icon: Trophy},
  {href: '/admin/escala', label: 'Escala de Trabalho', icon: CalendarDays},
  {href: '/admin/missions', label: 'Missões', icon: Target},
  {href: '/admin/academia', label: 'Academia', icon: GraduationCap},
  {href: '/admin/quiz', label: 'Quiz', icon: Puzzle},
  {href: '/admin/ofertas', label: 'Gestão de Ofertas', icon: ShoppingBag},
  {href: '/admin/historico', label: 'Histórico', icon: History},
  {href: '/admin/perfil', label: 'Perfil', icon: User},
  {href: '/admin/settings', label: 'Configurações', icon: Shield},
];

function AdminLayoutContent({ children, isDirty, setIsDirty }: { children: React.ReactNode; isDirty: boolean; setIsDirty: (dirty: boolean) => void; }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);

  const handleNavigate = (path: string) => {
    if (pathname === '/admin/settings' && isDirty) {
      setPendingPath(path);
    } else {
      router.push(path);
      if (isMobile) setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    const logoutPath = '/login';
    if (pathname === '/admin/settings' && isDirty) {
      setPendingPath(logoutPath);
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('loggedInSellerId');
      auth.signOut();
      router.push(logoutPath);
    }
    if (isMobile) setOpenMobile(false);
  };

  const handleConfirmNavigation = () => {
    if (pendingPath) {
      setIsDirty(false);
      if (pendingPath === '/login' && typeof window !== 'undefined') {
        localStorage.removeItem('loggedInSellerId');
        auth.signOut();
      }
      router.push(pendingPath);
      setPendingPath(null);
      if (isMobile) setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
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
          <AlertDialogHeader><AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle><AlertDialogDescription>Tem certeza de que deseja sair? As suas alterações serão perdidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmNavigation}>Sair</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminLayout({children}: {children: React.ReactNode}) {
  const state = useStore(s => s);
  const [isClient, setIsClient] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        await signInAnonymously(auth).catch(error => console.error("Firebase sign-in anónimo falhou:", error));
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!isAuthReady) return;

    // Sincroniza Vendedores
    const sellersCol = collection(db, 'sellers');
    const unsubSellers = onSnapshot(sellersCol, (snapshot) => {
        const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
        dataStore.setSellers(() => sellersFromDb);
    }, (error) => console.error("Erro ao sincronizar vendedores:", error));

    // --- LÓGICA ADICIONADA: Sincroniza Histórico de Ciclos ---
    const historyCol = collection(db, 'cycle_history');
    const q = query(historyCol, orderBy('endDate', 'asc'));
    const unsubHistory = onSnapshot(q, (snapshot) => {
        const historyFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
        dataStore.setCycleHistory(() => historyFromDb);
    }, (error) => console.error("Erro ao sincronizar histórico:", error));


    return () => {
        unsubSellers();
        unsubHistory();
    };
  }, [isAuthReady]);

  const contextValue = React.useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdminUser: dataStore.setAdminUser,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady,
    userId
  }), [state, isDirty, isAuthReady, userId]);

  if (!isClient || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        A autenticar...
      </div>
    );
  }

  return (
    <AdminContext.Provider value={contextValue as any}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AdminLayoutContent isDirty={isDirty} setIsDirty={setIsDirty}>
            {children}
          </AdminLayoutContent>
        </div>
      </SidebarProvider>
    </AdminContext.Provider>
  );
}