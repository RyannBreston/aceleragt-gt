'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Admin, Goals as GoalsType, Mission, Seller, DailySprint } from '@/lib/types';

interface AdminContextType {
  sellers: Seller[];
  goals: GoalsType | null;
  missions: Mission[];
  sprints: DailySprint[];
  admin: Admin | null;
  isLoading: boolean;
  isAdmin: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  saveSprint: (data: Omit<DailySprint, 'id' | 'created_at' | 'is_active'>, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (sprint: DailySprint, isActive: boolean) => Promise<void>;
  createSeller: (data: Omit<Seller, 'id' | 'role'> & { password?: string }) => Promise<void>;
  updateSeller: (data: Seller) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  changeSellerPassword: (userId: string, newPassword: string) => Promise<void>;
  saveMission: (data: Omit<Mission, 'id'>, id?: string) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  updateSettings: (data: { sellers: Seller[], goals: GoalsType['data'] }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  
  const [admin, ] = useState<Admin | null>(null);
  const [sellers, ] = useState<Seller[]>([]);
  const [goals, ] = useState<GoalsType | null>(null);
  const [missions, ] = useState<Mission[]>([]);
  const [sprints, ] = useState<DailySprint[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, ] = useState(true);

  const refreshData = useCallback(async () => {
    // ... (implementação da função)
  }, []);

  useEffect(() => {
    // ... (implementação do efeito)
  }, [session, status, refreshData]);

  const createSeller = useCallback(async () => {
    // ... (implementação da função)
  }, []);

  const updateSeller = useCallback(async () => {
    // ... (implementação da função)
  }, []);

  // ... (implementação de todas as outras funções de escrita com as tipagens corretas)
  
  const contextValue: AdminContextType = {
    sellers, goals, missions, sprints, admin,
    isLoading: isLoading || status === 'loading',
    isAdmin: !!admin,
    isDirty,
    setIsDirty,
    refreshData,
    createSeller,
    updateSeller,
    // ... (todas as funções de escrita)
  };

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};