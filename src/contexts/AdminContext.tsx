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

  // Lógica de autenticação e verificação de permissão
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      console.log("AUTH: onAuthStateChanged triggered. User:", user ? user.uid : "null");
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          console.log("AUTH: User claims role:", idTokenResult.claims.role);
          
          if (idTokenResult.claims.role === 'admin') {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            console.log("AUTH: User document exists in Firestore /users:", userDoc.exists());

            if (userDoc.exists()) {
              setAdmin({ id: user.uid, ...userDoc.data() } as Admin);
              console.log("AUTH: Admin context user set.", { id: user.uid, ...userDoc.data() });
            } else {
              console.log("AUTH: Admin user document not found.");
              setAdmin(null);
              setIsLoading(false);
            }
          } else {
            console.log("AUTH: User is not admin.");
            setAdmin(null);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("AUTH ERROR: Error verifying admin role:", error);
          setAdmin(null);
          setIsLoading(false);
        }
      } else {
        console.log("AUTH: No user logged in.");
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

  // Gerenciamento de dados do Firestore (depende de 'admin')
  useEffect(() => {
    console.log("DATA: Data fetching useEffect triggered. Admin state:", admin ? "present" : "null");
    if (!admin) {
      if (!auth.currentUser) {
        console.log("DATA: No admin and no current user. Setting loading false.");
        setIsLoading(false);
      }
      return;
    }

    console.log("DATA: Admin is present. Starting data listeners.");
    const listeners = [
      { path: 'sellers', setter: setSellers, name: "sellers" },
      { path: 'missions', setter: setMissions, name: "missions" },
      { path: 'dailySprints', setter: setSprints, name: "dailySprints" },
      { path: 'cycle_history', setter: setCycleHistory, name: "cycle_history" },
    ];
    let loadedCount = 0;

    const onDataLoaded = () => {
      loadedCount++;
      if (loadedCount === listeners.length + 1) { // +1 for goals
        console.log("DATA: All listeners loaded. Setting isLoading false.");
        setIsLoading(false);
      }
    };

    const unsubscribers = listeners.map(({ path, setter, name }) => {
      console.log(`DATA: Setting up listener for collection: ${path}`);
      const q = query(collection(db, path));
      return onSnapshot(q, (snapshot) => {
        console.log(`DATA: Received snapshot for ${name}. Docs count: ${snapshot.docs.length}`);
        setter(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as never);
        onDataLoaded();
      }, (error) => {
        console.error(`DATA ERROR: Error loading ${name}:`, error);
        onDataLoaded();
      });
    });

    console.log("DATA: Setting up listener for goals document.");
    const goalsRef = doc(db, 'goals', 'main');
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
      console.log(`DATA: Received snapshot for goals. Doc exists: ${doc.exists()}`);
      setGoals(doc.exists() ? doc.data() as GoalsType : null);
      onDataLoaded();
    }, (error) => {
      console.error("DATA ERROR: Error loading goals:", error);
      onDataLoaded();
    });
    unsubscribers.push(unsubGoals);

    return () => { 
      console.log("DATA: Cleaning up data listeners.");
      unsubscribers.forEach(unsub => unsub()); 
    };
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
