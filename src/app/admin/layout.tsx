'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LayoutGrid, LogOut, Puzzle, Shield, Target, Trophy, ShoppingBag, History, User, CalendarDays } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import type { Seller, CycleSnapshot } from '@/lib/types';
import { dataStore, useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { AdminContext } from '@/contexts/AdminContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

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

function AdminLayoutContent({ children, isDirty, setIsDirty }: { children: React.ReactNode; isDirty: boolean; setIsDirty: (dirty: boolean) => void; }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
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
      if (pendingPath === '/login') {
        auth.signOut();
      }
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
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza de que deseja sair? As suas alterações na página de Configurações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>Sair Mesmo Assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const state = useStore(s => s);
  const [isDirty, setIsDirty] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<{ isLoading: boolean; user: FirebaseUser | null; isAdmin: boolean }>({ isLoading: true, user: null, isAdmin: false });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setAuthStatus({ isLoading: false, user, isAdmin: true });
        } else {
          await auth.signOut();
          setAuthStatus({ isLoading: false, user: null, isAdmin: false });
          router.push('/login');
        }
      } else {
        setAuthStatus({ isLoading: false, user: null, isAdmin: false });
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  React.useEffect(() => {
    if (!authStatus.isAdmin) return;
    const sellersCol = collection(db, 'sellers');
    const unsubSellers = onSnapshot(sellersCol, (snapshot) => {
        const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
        dataStore.setSellers(() => sellersFromDb);
    });
    const historyCol = collection(db, 'cycle_history');
    const q = query(historyCol, orderBy('endDate', 'asc'));
    const unsubHistory = onSnapshot(q, (snapshot) => {
        const historyFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
        dataStore.setCycleHistory(() => historyFromDb);
    });
    return () => { unsubSellers(); unsubHistory(); };
  }, [authStatus.isAdmin]);
  
  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const contextValue = React.useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdminUser: dataStore.setAdminUser,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady: !authStatus.isLoading,
    userId: authStatus.user?.uid || null
  }), [state, isDirty, authStatus]);

  if (authStatus.isLoading || !authStatus.isAdmin) {
    return (
      <div className="flex min-h-screen">
        <DashboardSkeleton />
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