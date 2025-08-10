'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import { calculateSellerPrizes } from '@/lib/utils'; // Importa a função de cálculo
import type { Seller, Goals, Mission, CycleSnapshot, DailySprint, Admin, SellerWithPrizes } from '@/lib/types';

// 1. Definição da Interface do Contexto
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals | null;
  missions: Mission[];
  currentSeller: SellerWithPrizes | null; // Agora usa o tipo enriquecido
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
  const state = useStore(s => s);
  const { sellers, goals } = state;
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSeller, setCurrentSeller] = useState<SellerWithPrizes | null>(null);
  const [activeSprint, setActiveSprint] = useState<DailySprint | null>(null);
  
  const sprintsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`;

  useEffect(() => {
    let unsubscribers: (() => void)[] = [];
    
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      if (!user) {
        setIsSeller(false);
        setUserId(null);
        setCurrentSeller(null);
        setIsAuthReady(true);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'seller') {
        setUserId(user.uid);
        setIsSeller(true);

        const sellersUnsubscribe = onSnapshot(query(collection(db, 'sellers')), (snapshot) => {
            dataStore.setSellers(() => snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Seller));
        });

        const sprintsQuery = query(collection(db, sprintsCollectionPath), where('isActive', '==', true), where('participantIds', 'array-contains', user.uid), orderBy('createdAt', 'desc'), limit(1));
        const sprintUnsubscribe = onSnapshot(sprintsQuery, (snapshot) => {
            setActiveSprint(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DailySprint);
        });
        
        const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
        const goalsUnsubscribe = onSnapshot(goalsRef, (doc) => {
            dataStore.setGoals(() => (doc.exists() ? doc.data() as Goals : null));
        });

        unsubscribers = [sellersUnsubscribe, sprintUnsubscribe, goalsUnsubscribe];
        setIsAuthReady(true);
      } else {
        setIsSeller(false);
        setCurrentSeller(null);
        setIsAuthReady(true);
      }
    });

    return () => {
        authUnsubscribe();
        unsubscribers.forEach(unsub => unsub());
    };
  }, [sprintsCollectionPath]);

  // Efeito para calcular os prémios sempre que os dados relevantes mudam
  useEffect(() => {
    if (userId && sellers.length > 0 && goals) {
      const sellerData = sellers.find(s => s.id === userId);
      if (sellerData) {
        const sellerWithPrizes = calculateSellerPrizes(sellerData, sellers, goals);
        setCurrentSeller(sellerWithPrizes);
      }
    }
  }, [userId, sellers, goals]);

  const contextValue: SellerContextType = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    setGoals: dataStore.setGoals,
    setMissions: dataStore.setMissions,
    setAdmin: dataStore.setAdmin,
    setCycleHistory: dataStore.setCycleHistory,
    currentSeller,
    activeSprint,
    userId,
    isAuthReady,
    isSeller,
  }), [state, currentSeller, activeSprint, userId, isAuthReady, isSeller]);

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
