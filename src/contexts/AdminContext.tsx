'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.role === 'admin') {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setAdmin({ id: user.uid, ...userDoc.data() } as Admin);
          } else {
            setAdmin(null);
          }
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
        // Limpa os dados quando o utilizador faz logout
        setSellers([]);
        setGoals(null);
        setMissions([]);
        setSprints([]);
        setCycleHistory([]);
      }
      // O estado de carregamento será gerido pelo listener de dados
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!admin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribers: (() => void)[] = [];
    let listenersAttached = 0;
    const totalListeners = 5;

    const onDataLoaded = () => {
        listenersAttached++;
        if (listenersAttached === totalListeners) {
            setIsLoading(false);
        }
    };

    const createListener = <T,>(path: string, setter: React.Dispatch<React.SetStateAction<T[]>>, orderField = 'name', orderDir: 'asc' | 'desc' = 'asc') => {
        const q = query(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/${path}`), orderBy(orderField, orderDir));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setter(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T)));
            onDataLoaded();
        }, () => onDataLoaded());
        unsubscribers.push(unsubscribe);
    };

    createListener<Seller>('sellers', setSellers);
    createListener<DailySprint>('dailySprints', setSprints, 'createdAt', 'desc');
    createListener<Mission>('missions', setMissions);
    createListener<CycleSnapshot>('cycle_history', setCycleHistory, 'endDate');

    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
        setGoals(doc.exists() ? doc.data() as GoalsType : null);
        onDataLoaded();
    }, () => onDataLoaded());
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
