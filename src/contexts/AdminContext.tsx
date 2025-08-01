'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { Admin, Goals, Mission, Seller, CycleSnapshot } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals;
  setGoals: (updater: (prev: Goals) => Goals) => void;
  missions: Mission[];
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  adminUser: Admin;
  setAdminUser: (updater: (prev: Admin) => Admin) => void;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  cycleHistory: CycleSnapshot[];
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
  isAuthReady: boolean;
  userId: string | null;
}

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | null>(null);

// 3. Criação do Provider com toda a lógica
export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const state = useStore(s => s);
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ isLoading: boolean; user: FirebaseUser | null; isAdmin: boolean }>({ isLoading: true, user: null, isAdmin: false });

  // Efeito para verificar autenticação e permissão
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setAuthStatus({ isLoading: false, user, isAdmin: true });
        } else {
          // Se não for admin, faz logout e redireciona
          await auth.signOut();
          setAuthStatus({ isLoading: false, user: null, isAdmin: false });
          router.push('/login');
        }
      } else {
        // Se não houver usuário, redireciona
        setAuthStatus({ isLoading: false, user: null, isAdmin: false });
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Efeito para carregar dados do Firestore (sellers, histórico, etc.)
  useEffect(() => {
    if (!authStatus.isAdmin) return; // Só carrega os dados se for admin
    
    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      dataStore.setSellers(() => sellersFromDb);
    });

    const q = query(collection(db, 'cycle_history'), orderBy('endDate', 'asc'));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const historyFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
      dataStore.setCycleHistory(() => historyFromDb);
    });

    // Limpa os listeners quando o componente é desmontado
    return () => { unsubSellers(); unsubHistory(); };
  }, [authStatus.isAdmin]);

  // Efeito para o "beforeunload" (alterações não salvas)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Cria o valor do contexto
  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdminUser: dataStore.setAdminUser,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady: !authStatus.isLoading,
    userId: authStatus.user?.uid || null,
  }), [state, isDirty, authStatus]);

  // Enquanto carrega ou se não for admin, mostra um esqueleto de carregamento
  if (authStatus.isLoading || !authStatus.isAdmin) {
    return (
      <div className="flex min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  // Se for admin, fornece o contexto para os filhos
  return <AdminContext.Provider value={contextValue as any}>{children}</AdminContext.Provider>;
};

// 4. Hook para usar o contexto (sem alterações)
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};