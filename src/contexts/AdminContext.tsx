'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import type { Admin, Goals as GoalsType, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  goals: GoalsType | null;
  missions: Mission[];
  sprints: DailySprint[];
  admin: Admin | null;
  cycleHistory: CycleSnapshot[];
  isLoading: boolean;
  isAdmin: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  saveSprint: (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (id: string, isActive: boolean) => Promise<void>;
}

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 3. Provider Refatorado
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<GoalsType | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [cycleHistory, setCycleHistory] = useState<CycleSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Lógica de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult.claims.role === 'admin') {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setAdmin({ id: user.uid, ...userDoc.data() } as Admin);
            } else {
              setAdmin(null);
              setIsLoading(false);
            }
          } else {
            setAdmin(null);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          setAdmin(null);
          setIsLoading(false);
        }
      } else {
        setAdmin(null);
        setSellers([]);
        setGoals(null);
        setMissions([]);
        setSprints([]);
        setCycleHistory([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Gerenciamento de dados
  useEffect(() => {
    if (!admin) {
        if (!auth.currentUser) setIsLoading(false);
        return;
    }
    
    // Assegura que a variável de ambiente está disponível antes de fazer a query
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    if (!appId) {
        console.error("A variável de ambiente NEXT_PUBLIC_FIREBASE_APP_ID não está definida!");
        setIsLoading(false);
        return;
    }

    const dataPathPrefix = `artifacts/${appId}/public/data`;

    const listeners = [
      { path: `${dataPathPrefix}/sellers`, setter: setSellers },
      { path: `${dataPathPrefix}/missions`, setter: setMissions },
      { path: `${dataPathPrefix}/dailySprints`, setter: setSprints },
      { path: `${dataPathPrefix}/cycle_history`, setter: setCycleHistory },
    ];
    let loadedCount = 0;

    const onDataLoaded = () => {
      loadedCount++;
      if (loadedCount === listeners.length + 1) { // +1 para goals
        setIsLoading(false);
      }
    };

    const unsubscribers = listeners.map(({ path, setter }) => {
      const q = query(collection(db, path));
      return onSnapshot(q, (snapshot) => {
        setter(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as never);
        onDataLoaded();
      }, (error) => {
        console.error(`Error loading ${path}:`, error);
        onDataLoaded();
      });
    });

    const goalsRef = doc(db, `${dataPathPrefix}/goals/main`);
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
      setGoals(doc.exists() ? doc.data() as GoalsType : null);
      onDataLoaded();
    }, (error) => {
      console.error("Error loading goals:", error);
      onDataLoaded();
    });
    unsubscribers.push(unsubGoals);

    return () => { unsubscribers.forEach(unsub => unsub()); };
  }, [admin]);

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

  const contextValue: AdminContextType = {
    sellers,
    goals,
    missions,
    sprints,
    admin,
    cycleHistory,
    isLoading,
    isAdmin: !!admin,
    isDirty,
    setIsDirty,
    saveSprint,
    deleteSprint,
    toggleSprint,
  };

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

// Hook para usar o contexto
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};
