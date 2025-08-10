'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import type { Admin, Goals, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals | null;
  setGoals: (updater: (prev: Goals | null) => Goals | null) => void;
  missions: Mission[];
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  sprints: DailySprint[];
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

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 3. Provider Refatorado
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const state = useStore(s => s);
  const [isDirty, setIsDirty] = useState(false);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [authStatus, setAuthStatus] = useState<{ isAuthReady: boolean; user: FirebaseUser | null; isAdmin: boolean }>({ isAuthReady: false, user: null, isAdmin: false });

  const sprintsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          dataStore.setAdmin(() => ({ id: user.uid, ...userDoc.data() } as Admin));
          setAuthStatus({ isAuthReady: true, user, isAdmin: true });
        } else {
          setAuthStatus({ isAuthReady: true, user: null, isAdmin: false });
        }
      } else {
        setAuthStatus({ isAuthReady: true, user: null, isAdmin: false });
      }
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
    if (!authStatus.isAuthReady || !authStatus.isAdmin) return;

    const unsubSellers = onSnapshot(query(collection(db, 'sellers'), orderBy('name', 'asc')), (snapshot) => {
      dataStore.setSellers(() => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller)));
    });

    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
        dataStore.setGoals(() => (doc.exists() ? doc.data() as Goals : null));
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
  }, [authStatus.isAuthReady, authStatus.isAdmin, sprintsCollectionPath]);

  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdmin: dataStore.setAdmin,
    setCycleHistory: dataStore.setCycleHistory,
    isDirty,
    setIsDirty,
    isAuthReady: authStatus.isAuthReady,
    isAdmin: authStatus.isAdmin,
    userId: authStatus.user?.uid || null,
    sprints,
    toggleSprint,
  }), [state, isDirty, authStatus, sprints, toggleSprint]);

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
