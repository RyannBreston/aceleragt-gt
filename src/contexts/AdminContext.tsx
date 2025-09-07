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
  
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<GoalsType | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (status === 'authenticated' && session) {
        // Simulando a busca de dados. Substitua com as chamadas de API reais.
        const adminResponse = await fetch('/api/users/' + session.user.id);
        const adminData = await adminResponse.json();
        setAdmin(adminData);

        const sellersResponse = await fetch('/api/sellers');
        const sellersData = await sellersResponse.json();
        setSellers(sellersData);
        
        // Adicione aqui outras buscas de dados (metas, missões, etc.)
      }
    } catch (error) {
      console.error("Falha ao carregar dados do admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      refreshData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, refreshData]);
  
  // Funções de CRUD (Create, Read, Update, Delete) - Implementação de exemplo
  const createSeller = useCallback(async (data: Omit<Seller, 'id' | 'role'> & { password?: string }) => {
    await fetch('/api/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  }, [refreshData]);

  const updateSeller = useCallback(async (data: Seller) => {
    await fetch(`/api/sellers/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    await refreshData();
  }, [refreshData]);

  const deleteSeller = useCallback(async (id: string) => {
    await fetch(`/api/sellers/${id}`, { method: 'DELETE' });
    await refreshData();
  }, [refreshData]);

  const changeSellerPassword = useCallback(async (userId: string, newPassword: string) => {
    await fetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
    });
  }, []);

  const saveSprint = useCallback(async (data: Omit<DailySprint, 'id' | 'created_at' | 'is_active'>, id?: string) => {
    const url = id ? `/api/sprints/${id}` : '/api/sprints';
    const method = id ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  }, [refreshData]);

  const deleteSprint = useCallback(async (id: string) => {
    await fetch(`/api/sprints/${id}`, { method: 'DELETE' });
    await refreshData();
  }, [refreshData]);

  const toggleSprint = useCallback(async (sprint: DailySprint, isActive: boolean) => {
      // Implementar a lógica no backend se necessário, ou apenas atualizar o estado
      await refreshData();
  }, [refreshData]);

  const saveMission = useCallback(async (data: Omit<Mission, 'id'>, id?: string) => {
      const url = id ? `/api/missions/${id}` : '/api/missions';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
      });
      await refreshData();
  }, [refreshData]);

  const deleteMission = useCallback(async (id: string) => {
      await fetch(`/api/missions/${id}`, { method: 'DELETE' });
      await refreshData();
  }, [refreshData]);

  const updateSettings = useCallback(async (data: { sellers: Seller[], goals: GoalsType['data'] }) => {
      // Implementar a lógica de atualização das configurações
      console.log("Updating settings with:", data);
      await refreshData();
  }, [refreshData]);


  const contextValue: AdminContextType = {
    sellers, goals, missions, sprints, admin,
    isLoading: isLoading || status === 'loading',
    isAdmin: !!admin,
    isDirty,
    setIsDirty,
    refreshData,
    createSeller,
    updateSeller,
    saveSprint,
    deleteSprint,
    toggleSprint,
    deleteSeller,
    changeSellerPassword,
    saveMission,
    deleteMission,
    updateSettings,
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
