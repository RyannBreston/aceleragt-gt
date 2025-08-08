'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import type { Seller, Goals, Mission, CycleSnapshot, DailySprint, Admin } from '@/lib/types';

// 1. Definição da Interface do Contexto
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals | null;
  missions: Mission[];
  currentSeller: Seller | null;
  cycleHistory: CycleSnapshot[];
  activeSprint: DailySprint | null;
  isAuthReady: boolean;
  userId: string | null;
  isSeller: boolean;
  admin: Admin | null; 
  setAdmin: (updater: (prev: Admin | null) => Admin | null) => void;
  setGoals: (updater: (prev: Goals | null) => Goals | null) => void;
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
}

// 2. Criação do Contexto
const SellerContext = createContext<SellerContextType | undefined>(undefined);

// 3. Criação do Provider
export const SellerProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const state = useStore(s => s);
  const [authStatus, setAuthStatus] = useState<{ isAuthReady: boolean; user: FirebaseUser | null; isSeller: boolean }>({ isAuthReady: false, user: null, isSeller: false });
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
  const [activeSprint, setActiveSprint] = useState<DailySprint | null>(null);

  const sprintsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`;

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'seller') {
          setAuthStatus({ isAuthReady: true, user, isSeller: true });
        } else {
          setAuthStatus({ isAuthReady: true, user: null, isSeller: false });
        }
      } else {
        setAuthStatus({ isAuthReady: true, user: null, isSeller: false });
      }
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!authStatus.isAuthReady || !authStatus.isSeller || !authStatus.user) return;

    const sprintsQuery = query(collection(db, sprintsCollectionPath), where('isActive', '==', true), where('participantIds', 'array-contains', authStatus.user.uid), orderBy('createdAt', 'desc'), limit(1));
    const sprintUnsubscribe = onSnapshot(sprintsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSprint({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DailySprint);
      } else {
        setActiveSprint(null);
      }
    });

    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const goalsUnsubscribe = onSnapshot(goalsRef, (doc) => {
        dataStore.setGoals(() => (doc.exists() ? doc.data() as Goals : null));
    });

    const sellersUnsubscribe = onSnapshot(query(collection(db, 'sellers'), orderBy('name', 'asc')), (snapshot) => {
      dataStore.setSellers(() => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller)));
    });

    return () => {
      sprintUnsubscribe();
      goalsUnsubscribe();
      sellersUnsubscribe();
    };
  }, [authStatus.isAuthReady, authStatus.isSeller, authStatus.user, sprintsCollectionPath]);

  useEffect(() => {
    if (authStatus.isSeller && authStatus.user) {
      const sellerData = state.sellers.find(s => s.id === authStatus.user!.uid);
      if (sellerData) setCurrentSeller(sellerData);
    } else {
      setCurrentSeller(null);
    }
  }, [authStatus, state.sellers]);

  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdmin: dataStore.setAdmin,
    setCycleHistory: dataStore.setCycleHistory,
    currentSeller,
    activeSprint,
    userId: authStatus.user?.uid || null,
    isAuthReady: authStatus.isAuthReady,
    isSeller: authStatus.isSeller,
  }), [state, currentSeller, authStatus, activeSprint]);

  return <SellerContext.Provider value={contextValue}>{children}</SellerContext.Provider>;
};

// 4. Hook para usar o contexto
export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (context === undefined) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};