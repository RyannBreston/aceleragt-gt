'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { store, useStore } from '@/lib/store';
import { calculateSellerPrizes } from '@/lib/client-utils';
import type { Seller, Goals, Mission, CycleSnapshot, DailySprint, Admin, SellerWithPrizes } from '@/lib/types';

// 1. Definição da Interface do Contexto
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals | null;
  missions: Mission[];
  currentSeller: SellerWithPrizes | null;
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSeller, setCurrentSeller] = useState<SellerWithPrizes | null>(null);
  const [activeSprint, setActiveSprint] = useState<DailySprint | null>(null);
  
  const sprintsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`;

  // Efeito para autenticação e dados globais
  useEffect(() => {
    let dataUnsubscribers: (() => void)[] = [];

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      // Limpa listeners antigos ao mudar de usuário
      dataUnsubscribers.forEach(unsub => unsub());
      dataUnsubscribers = [];
      
      if (!user) {
        setIsSeller(false);
        setUserId(null);
        setCurrentSeller(null);
        setIsAuthReady(true); // Fim do processo para usuário deslogado
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'seller') {
        setUserId(user.uid);
        setIsSeller(true);

        const sellersUnsubscribe = onSnapshot(query(collection(db, 'sellers')), (snapshot) => {
            store.getState().setSellers(() => snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Seller));
        });
        
        const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
        const goalsUnsubscribe = onSnapshot(goalsRef, (doc) => {
            store.getState().setGoals(() => (doc.exists() ? doc.data() as Goals : null));
        });
        
        dataUnsubscribers.push(sellersUnsubscribe, goalsUnsubscribe);
      } else {
        setIsSeller(false);
        setCurrentSeller(null);
      }
      // Garante que o estado de "pronto" seja definido para todos os caminhos de usuário logado
      setIsAuthReady(true);
    });

    return () => {
      authUnsubscribe();
      dataUnsubscribers.forEach(unsub => unsub());
    };
  }, []);
  
  // Efeito para buscar a corridinha ativa do vendedor logado
  useEffect(() => {
    if (!userId) {
        setActiveSprint(null);
        return;
    }
    const sprintsQuery = query(collection(db, sprintsCollectionPath), where('isActive', '==', true), where('participantIds', 'array-contains', userId), orderBy('createdAt', 'desc'), limit(1));
    const sprintUnsubscribe = onSnapshot(sprintsQuery, (snapshot) => {
        setActiveSprint(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DailySprint);
    });

    return () => sprintUnsubscribe();
  }, [userId, sprintsCollectionPath]);


  // Efeito para calcular os dados do vendedor atual
  useEffect(() => {
    const unsub = store.subscribe(({ sellers, goals }) => {
        if (userId && sellers.length > 0 && goals) {
            const sellerData = sellers.find(s => s.id === userId);
            if (sellerData) {
                const sellerWithPrizes = calculateSellerPrizes(sellerData, sellers, goals);
                setCurrentSeller(sellerWithPrizes);
            }
        } else {
            setCurrentSeller(null);
        }
    });
    return () => unsub();
  }, [userId]);

  const contextValue: SellerContextType = useMemo(() => ({
    ...state,
    setSellers: store.getState().setSellers,
    setGoals: store.getState().setGoals,
    setMissions: store.getState().setMissions,
    setAdmin: store.getState().setAdmin,
    setCycleHistory: store.getState().setCycleHistory,
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
