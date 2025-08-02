'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import type { Admin, Goals, Mission, Seller, CycleSnapshot } from '@/lib/types';

// 1. Definição da Interface (adicionado isAdmin)
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
  isAdmin: boolean; // Propriedade chave para a proteção de rotas
  userId: string | null;
}

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | null>(null);

// 3. Provider Refatorado: Apenas fornece os dados
export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const state = useStore(s => s);
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ isAuthReady: boolean; user: FirebaseUser | null; isAdmin: boolean }>({ isAuthReady: false, user: null, isAdmin: false });

  // Efeito para verificar o estado de autenticação e a permissão 'admin'
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        // Define o estado com base na verificação
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setAuthStatus({ isAuthReady: true, user, isAdmin: true });
        } else {
          // Se o utilizador existe mas não é admin, marca como não-admin
          setAuthStatus({ isAuthReady: true, user: null, isAdmin: false });
        }
      } else {
        // Se não há utilizador, marca como pronto e não-admin
        setAuthStatus({ isAuthReady: true, user: null, isAdmin: false });
      }
    });
    return () => unsubscribe();
  }, []);

  // Efeito para carregar os dados do Firestore se o utilizador for admin
  useEffect(() => {
    if (!authStatus.isAdmin) return; // Só executa se a verificação de admin for positiva

    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      dataStore.setSellers(() => sellersFromDb);
    });

    const q = query(collection(db, 'cycle_history'), orderBy('endDate', 'asc'));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const historyFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
      dataStore.setCycleHistory(() => historyFromDb);
    });

    return () => { unsubSellers(); unsubHistory(); };
  }, [authStatus.isAdmin]);

  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdminUser: dataStore.setAdminUser,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady: authStatus.isAuthReady,
    isAdmin: authStatus.isAdmin,
    userId: authStatus.user?.uid || null,
  }), [state, isDirty, authStatus]);

  // O Provider agora SEMPRE retorna o contexto, envolvendo os seus filhos.
  // A decisão de mostrar o conteúdo ou redirecionar será feita no Layout.
  return <AdminContext.Provider value={contextValue as any}>{children}</AdminContext.Provider>;
};

// 4. Hook para usar o contexto
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};