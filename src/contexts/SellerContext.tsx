'use client';

import React, { createContext, useContext } from 'react';
import type { Seller, Goals, Mission, CycleSnapshot } from '@/lib/types';

// 1. Definição da Interface do Contexto
interface SellerContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals;
  missions: Mission[];
  currentSeller: Seller;
  cycleHistory: CycleSnapshot[];
  isAuthReady: boolean;
  userId: string | null;
}

// 2. Criação do Contexto
export const SellerContext = createContext<SellerContextType | null>(null);

// 3. Criação do Hook para facilitar o uso
export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};