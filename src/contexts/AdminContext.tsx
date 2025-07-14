'use client';

import React, { createContext, useContext } from 'react';
import type { Admin, Goals, Mission, Seller, CycleSnapshot } from '@/lib/types';

// 1. Definição da Interface do Contexto
interface AdminContextType {
  sellers: Seller[];
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  goals: Goals;
  setGoals: (updater: (prev: Goals) => Goals) => void;
  missions: Mission[];
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  adminUser: Admin;
  setAdminUser: (updater: (prev: Admin) => Admin) => void;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  cycleHistory: CycleSnapshot[];
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
  isAuthReady: boolean;
  userId: string | null;
}

// 2. Criação do Contexto
export const AdminContext = createContext<AdminContextType | null>(null);

// 3. Criação do Hook para facilitar o uso
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};