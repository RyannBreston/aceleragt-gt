'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { MobileSidebar } from './MobileSidebar'; // Importação Nomeada
import type { Admin, Goals as GoalsType, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

interface AdminContextType {
  sellers: Seller[];
  goals: GoalsType | null;
  missions: Mission[];
  sprints: DailySprint[];
  admin: Admin | null;
  cycleHistory: CycleSnapshot[];
  isLoading: boolean;
  isAdmin: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Funções de escrita
  saveSprint: (data: Omit<DailySprint, 'id' | 'createdAt' | 'is_active'>, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (sprint: DailySprint, isActive: boolean) => Promise<void>;
  createSeller: (data: any) => Promise<void>;
  updateSeller: (data: any) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  saveMission: (data: any, id?: string) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;

  // Função para recarregar os dados
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<GoalsType | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [cycleHistory, setCycleHistory] = useState<CycleSnapshot[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // **INÍCIO DA CORREÇÃO**
  // A função de busca de dados foi movida para dentro do useCallback
  // e o próprio useEffect foi simplificado para evitar loops.
  const refreshData = useCallback(async () => {
    // Apenas busca dados se for um admin autenticado
    if (status !== 'authenticated' || session?.user?.role !== 'admin') {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [sellersRes, goalsRes, missionsRes, sprintsRes] = await Promise.all([
        fetch('/api/sellers'),
        fetch('/api/goals'),
        fetch('/api/missions'),
        fetch('/api/sprints'),
      ]);

      if (!sellersRes.ok || !goalsRes.ok || !missionsRes.ok || !sprintsRes.ok) {
        throw new Error('Falha ao carregar os dados da aplicação.');
      }

      const sellersData = await sellersRes.json();
      const goalsData = await goalsRes.json();
      const missionsData = await missionsRes.json();
      const sprintsData = await sprintsRes.json();

      setSellers(sellersData);
      setGoals(goalsData);
      setMissions(missionsData);
      setSprints(sprintsData);

    } catch (error) {
      console.error("Erro ao buscar dados da API:", error);
      toast({ variant: 'destructive', title: 'Erro de Rede', description: 'Não foi possível carregar os dados.' });
    } finally {
      setIsLoading(false);
    }
  }, [session, status, toast]); // As dependências aqui estão corretas

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      setAdmin({
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: 'admin',
      });
      refreshData();
    } else if (status !== 'loading') {
      // Limpa os dados se não for um admin ou se o utilizador sair
      setIsLoading(false);
      setAdmin(null);
      setSellers([]);
      setMissions([]);
      setSprints([]);
      setGoals(null);
    }
  }, [session, status, refreshData]);
  // **FIM DA CORREÇÃO**
  
  // Funções de Sprints (sem alterações)
  const saveSprint = useCallback(async (data: Omit<DailySprint, 'id'|'createdAt'|'is_active'>, id?: string) => {
    const method = id ? 'PUT' : 'POST';
    const body = JSON.stringify({ ...data, id });
    const response = await fetch('/api/sprints', { method, headers: { 'Content-Type': 'application/json' }, body });
    if (!response.ok) throw new Error('Falha ao salvar a corridinha.');
    await refreshData();
    toast({ title: 'Sucesso!', description: `Corridinha ${id ? 'atualizada' : 'criada'} com sucesso.` });
  }, [refreshData, toast]);

  const deleteSprint = useCallback(async (id: string) => {
    const response = await fetch(`/api/sprints/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Falha ao excluir a corridinha.');
    await refreshData();
    toast({ title: 'Sucesso!', description: 'Corridinha excluída.' });
  }, [refreshData, toast]);

  const toggleSprint = useCallback(async (sprint: DailySprint, isActive: boolean) => {
    const response = await fetch('/api/sprints', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sprint, isActive }) });
    if (!response.ok) throw new Error('Falha ao alterar o estado da corridinha.');
    await refreshData();
    toast({ title: 'Sucesso!', description: `Corridinha ${isActive ? 'ativada' : 'desativada'}.` });
  }, [refreshData, toast]);

  // Funções de Vendedores (sem alterações)
  const createSeller = useCallback(async (data: any) => {
    const response = await fetch('/api/sellers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao criar o vendedor.'); }
    await refreshData();
    toast({ title: 'Sucesso!', description: 'Vendedor criado com sucesso.' });
  }, [refreshData, toast]);

  const updateSeller = useCallback(async (data: any) => {
    const response = await fetch('/api/sellers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao atualizar o vendedor.'); }
    await refreshData();
    toast({ title: 'Sucesso!', description: 'Vendedor atualizado com sucesso.' });
  }, [refreshData, toast]);

  const deleteSeller = useCallback(async (id: string) => {
    const response = await fetch(`/api/sellers/${id}`, { method: 'DELETE' });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao excluir o vendedor.'); }
    await refreshData();
    toast({ title: 'Sucesso!', description: 'Vendedor excluído.' });
  }, [refreshData, toast]);
  
  // Funções de Missões (sem alterações)
  const saveMission = useCallback(async (data: any, id?: string) => {
    const method = id ? 'PUT' : 'POST';
    const body = JSON.stringify({ ...data, id });
    const response = await fetch('/api/missions', { method, headers: { 'Content-Type': 'application/json' }, body });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao salvar a missão.'); }
    await refreshData();
    toast({ title: 'Sucesso!', description: `Missão ${id ? 'atualizada' : 'criada'} com sucesso.` });
  }, [refreshData, toast]);

  const deleteMission = useCallback(async (id: string) => {
    const response = await fetch(`/api/missions/${id}`, { method: 'DELETE' });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao excluir a missão.'); }
    await refreshData();
    toast({ title: 'Sucesso!', description: 'Missão excluída.' });
  }, [refreshData, toast]);

  const contextValue: AdminContextType = {
    sellers,
    goals,
    missions,
    sprints,
    admin,
    cycleHistory,
    isLoading: isLoading || status === 'loading',
    isAdmin: !!admin,
    isDirty,
    setIsDirty,
    refreshData,
    saveSprint,
    deleteSprint,
    toggleSprint,
    createSeller,
    updateSeller,
    deleteSeller,
    saveMission,
    deleteMission,
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