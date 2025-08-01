'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, dataStore } from '@/lib/store';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { Seller, Goals, Mission, CycleSnapshot } from '@/lib/types';

// 1. Definição da Interface
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals;
  missions: Mission[];
  currentSeller: Seller | null; // Pode ser null durante o carregamento
  cycleHistory: CycleSnapshot[];
  isAuthReady: boolean;
  userId: string | null;
}

// 2. Criação do Contexto
const SellerContext = createContext<SellerContextType | null>(null);

// 3. Criação do Provider com a lógica de autenticação e dados
export const SellerProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const state = useStore(s => s);
  const [authStatus, setAuthStatus] = useState<{ isLoading: boolean; user: FirebaseUser | null; isSeller: boolean }>({ isLoading: true, user: null, isSeller: false });
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);

  // Efeito para verificar autenticação e permissão
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ### CORREÇÃO DE SEGURANÇA AQUI ###
        // Busca o 'role' do utilizador na coleção 'users'
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        // Verifica se o utilizador existe e se tem a função 'seller'
        if (userDoc.exists() && userDoc.data().role === 'seller') {
          setAuthStatus({ isLoading: false, user, isSeller: true });
        } else {
          // Se não for um vendedor, faz logout e redireciona
          await auth.signOut();
          setAuthStatus({ isLoading: false, user: null, isSeller: false });
          router.push('/login');
        }
      } else {
        // Se não houver utilizador, redireciona
        setAuthStatus({ isLoading: false, user: null, isSeller: false });
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Efeito para carregar os dados de todos os vendedores (para rankings, etc.)
  useEffect(() => {
    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const sellersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
      dataStore.setSellers(() => sellersFromDb);
    });
    return () => unsubSellers();
  }, []);

  // Efeito para definir o vendedor atual (currentSeller)
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

  // Cria o valor do contexto
  const contextValue = useMemo(() => ({
    ...state,
    setSellers: dataStore.setSellers,
    currentSeller,
    userId: authStatus.user?.uid || null,
    isAuthReady: !authStatus.isLoading && !!currentSeller,
  }), [state, currentSeller, authStatus]);

  // Enquanto carrega ou se não for um vendedor válido, mostra um esqueleto
  if (authStatus.isLoading || !authStatus.isSeller || !currentSeller) {
    return (
      <div className="flex min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  // Se for um vendedor válido, fornece o contexto
  return <SellerContext.Provider value={contextValue as any}>{children}</SellerContext.Provider>;
};

// 4. Hook para usar o contexto
export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};