'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import type { Admin, Goals as GoalsType, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  goals: GoalsType | null;
  missions: Mission[];
  sprints: DailySprint[];
  saveSprint: (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (id: string, isActive: boolean) => Promise<void>;
  admin: Admin | null;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  cycleHistory: CycleSnapshot[];
  isAuthReady: boolean;
  isAdmin: boolean;
  userId: string | null;
}

export type { GoalsType as Goals };

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 3. Provider Refatorado
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { sellers, goals, missions, sprints, admin, cycleHistory } = useStore(s => s);
  const [isDirty, setIsDirty] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubscribers: (() => void)[] = [];

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      // Limpa listeners antigos ao mudar de usuário ou ao deslogar
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];
      dataStore.setAdmin(() => null); // Reseta o admin

      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.role === 'admin') {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            dataStore.setAdmin(() => ({ id: user.uid, ...userDoc.data() } as Admin));

            // Configura os listeners DEPOIS de confirmar que o usuário é um admin
            const createListener = <T,>(path: string, setter: (updater: (prev: T[]) => T[]) => void, orderField = 'name', orderDir: 'asc' | 'desc' = 'asc') => {
                const q = query(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/${path}`), orderBy(orderField, orderDir));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    setter(() => snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T)));
                });
                unsubscribers.push(unsubscribe);
            };

            createListener<Seller>('sellers', dataStore.setSellers);
            createListener<DailySprint>('dailySprints', dataStore.setSprints, 'createdAt', 'desc');
            createListener<Mission>('missions', dataStore.setMissions);
            createListener<CycleSnapshot>('cycle_history', dataStore.setCycleHistory, 'endDate');

            const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
            const unsubGoals = onSnapshot(goalsRef, (doc) => {
                dataStore.setGoals(() => (doc.exists() ? doc.data() as GoalsType : null));
            });
            unsubscribers.push(unsubGoals);
          }
        }
      }
      // Marca como pronto apenas no final do processo
      setIsAuthReady(true);
    });

    return () => {
      authUnsubscribe();
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const callApi = useCallback(async (action: string, data: object) => {
    const callable = httpsCallable(functions, 'api');
    await callable({ action, ...data });
  }, []);

  const saveSprint = useCallback(
    (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => callApi(id ? 'updateDailySprint' : 'createDailySprint', { ...data, id }),
    [callApi]
  );
  const deleteSprint = useCallback((id: string) => callApi('deleteDailySprint', { id }), [callApi]);
  const toggleSprint = useCallback((id: string, isActive: boolean) => callApi('toggleDailySprint', { id, isActive }), [callApi]);

  const contextValue = useMemo(() => ({
    sellers,
    goals,
    missions,
    sprints,
    cycleHistory,
    admin,
    isDirty,
    setIsDirty,
    isAuthReady,
    isAdmin: !!admin,
    userId: admin?.id || null,
    saveSprint,
    deleteSprint,
    toggleSprint,
  }), [sellers, goals, missions, sprints, cycleHistory, admin, isDirty, isAuthReady, saveSprint, deleteSprint, toggleSprint]);

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

// 4. Hook para usar o contexto
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};
