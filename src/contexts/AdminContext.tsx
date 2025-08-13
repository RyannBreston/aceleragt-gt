'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import type { Admin, Goals as GoalsType, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: GoalsType | null;
  setGoals: (updater: (prev: GoalsType | null) => GoalsType | null) => void;
  missions: Mission[];
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  sprints: DailySprint[];
  setSprints: (updater: (prev: DailySprint[]) => DailySprint[]) => void;
  toggleSprint: (sprintId: string, currentState: boolean) => Promise<void>;
  admin: Admin | null;
  setAdmin: (updater: (prev: Admin | null) => Admin | null) => void;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  cycleHistory: CycleSnapshot[];
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
  isAuthReady: boolean;
  isAdmin: boolean;
  userId: string | null;
}

export type { GoalsType as Goals };

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 3. Provider Refatorado
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const state = useStore(s => s);
  const [isDirty, setIsDirty] = useState(false);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const sprintsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Força a atualização do token para obter as custom claims mais recentes.
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.role === 'admin') {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            dataStore.setAdmin(() => ({ id: user.uid, ...userDoc.data() } as Admin));
          } else {
             dataStore.setAdmin(() => null);
          }
        } else {
          dataStore.setAdmin(() => null);
        }
      } else {
        dataStore.setAdmin(() => null);
      }
      // Só considera a autenticação pronta DEPOIS de verificar o token.
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const toggleSprint = useCallback(async (sprintId: string, currentState: boolean) => {
    const batch = writeBatch(db);
    const newActiveState = !currentState;
    
    if (newActiveState) {
        sprints.forEach(sprint => {
            if (sprint.isActive) {
                const sprintRef = doc(db, sprintsCollectionPath, sprint.id);
                batch.update(sprintRef, { isActive: false });
            }
        });
    }

    const sprintRef = doc(db, sprintsCollectionPath, sprintId);
    batch.update(sprintRef, { isActive: newActiveState });

    await batch.commit();
  }, [sprints, sprintsCollectionPath]);

  useEffect(() => {
    if (!isAuthReady || !state.admin) return;

    const unsubSellers = onSnapshot(query(collection(db, 'sellers'), orderBy('name', 'asc')), (snapshot) => {
      dataStore.setSellers(() => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller)));
    });

    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
        dataStore.setGoals(() => (doc.exists() ? doc.data() as GoalsType : null));
    });

    const sprintsQuery = query(collection(db, sprintsCollectionPath), orderBy('createdAt', 'desc'));
    const unsubSprints = onSnapshot(sprintsQuery, (snapshot) => {
        const sprintsFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailySprint));
        setSprints(sprintsFromDb);
    });
    
    const missionsQuery = query(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/missions`));
    const unsubMissions = onSnapshot(missionsQuery, (snapshot) => {
        const missionsFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        dataStore.setMissions(() => missionsFromDb);
    });

    const unsubHistory = onSnapshot(query(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/cycle_history`), orderBy('endDate', 'asc')), (snapshot) => {
      const historyFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
      dataStore.setCycleHistory(() => historyFromDb);
    });

    return () => { unsubSellers(); unsubHistory(); unsubGoals(); unsubMissions(); unsubSprints(); };
  }, [isAuthReady, state.admin, sprintsCollectionPath]);

  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdmin: dataStore.setAdmin,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady,
    isAdmin: !!state.admin,
    userId: state.admin?.id || null,
    sprints,
    setSprints,
    toggleSprint,
  }), [state, isDirty, isAuthReady, sprints, toggleSprint]);

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
