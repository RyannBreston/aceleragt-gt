'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { Seller, Goals, Mission, CycleSnapshot } from '@/lib/types';

// Interface (sem alterações)
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals;
  missions: Mission[];
  currentSeller: Seller | null;
  cycleHistory: CycleSnapshot[];
  isAuthReady: boolean;
  userId: string | null;
}

const SellerContext = createContext<SellerContextType | null>(null);

export const SellerProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const state = useStore(s => s);
  const [authStatus, setAuthStatus] = useState<{ isLoading: boolean; user: FirebaseUser | null; isSeller: boolean }>({ isLoading: true, user: null, isSeller: false });
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);

  // Efeito de autenticação (sem alterações)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'seller') {
          setAuthStatus({ isLoading: false, user, isSeller: true });
        } else {
          await auth.signOut();
          setAuthStatus({ isLoading: false, user: null, isSeller: false });
          router.push('/login');
        }
      } else {
        setAuthStatus({ isLoading: false, user: null, isSeller: false });
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ NOVO EFEITO: Carrega as configurações de metas e módulos
  useEffect(() => {
    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const unsubscribe = onSnapshot(goalsRef, (doc) => {
        if (doc.exists()) {
            dataStore.setGoals(() => doc.data() as Goals);
        }
    });
    return () => unsubscribe();
  }, []);

  // Efeito para carregar vendedores (sem alterações)
  useEffect(() => {
    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      dataStore.setSellers(() => sellersFromDb);
    });
    return () => unsubSellers();
  }, []);

  // Efeito para definir o vendedor atual (sem alterações)
  useEffect(() => {
    if (authStatus.isSeller && authStatus.user) {
      const sellerData = state.sellers.find(s => s.id === authStatus.user!.uid);
      if (sellerData) {
        setCurrentSeller(sellerData);
      }
    } else {
      setCurrentSeller(null);
    }
  }, [authStatus, state.sellers]);

  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    currentSeller,
    userId: authStatus.user?.uid || null,
    isAuthReady: !authStatus.isLoading && !!currentSeller,
  }), [state, currentSeller, authStatus]);

  if (authStatus.isLoading || !currentSeller) {
    return <div className="flex min-h-screen"><DashboardSkeleton /></div>;
  }

  return <SellerContext.Provider value={contextValue as any}>{children}</SellerContext.Provider>;
};

export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};