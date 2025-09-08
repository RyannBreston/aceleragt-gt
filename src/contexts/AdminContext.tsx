'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailySprint, Mission, Seller, Goals } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

interface AdminContextType {
  sellers: Seller[] | null;
  missions: Mission[] | null;
  sprints: DailySprint[] | null;
  goals: Goals | null;
  isLoading: boolean;
  refetch: () => void;
  updateSettings: (data: { sellers: Seller[], goals: any }) => Promise<void>;
  saveSprint: (data: any, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (sprint: DailySprint, isActive: boolean) => Promise<void>;
  saveSeller: (data: any, id?: string) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  saveMission: (data: any, id?: string) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [sprints, setSprints] = useState<DailySprint[] | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const response = await fetch('/api/admin');
      if (!response.ok) {
        throw new Error('A resposta da rede não foi boa');
      }
      const data = await response.json();
      setSellers(data.sellers || []);
      setMissions(data.missions || []);
      setSprints(data.sprints || []);
      setGoals(data.goals || null);
    } catch (error) {
      console.error('Falha ao carregar dados do admin:', error);
      toast({ 
        variant: "destructive", 
        title: "Erro de Rede", 
        description: "Não foi possível carregar os dados do painel." 
      });
      setSellers([]);
      setMissions([]);
      setSprints([]);
      setGoals(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const apiRequest = async (url: string, method: string, body?: any) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha na operação' }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      if (response.status === 204) return null;
      return response.json();
    } catch (error) {
      console.error(`Erro na requisição ${method} ${url}:`, error);
      toast({ 
        variant: "destructive", 
        title: "Erro na Operação", 
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado." 
      });
      throw error;
    }
  };

  const saveSeller = async (data: any, id?: string) => {
    try {
      await apiRequest(
        id ? `/api/sellers/${id}` : '/api/register', 
        id ? 'PUT' : 'POST', 
        { ...data, role: 'seller' }
      );
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: `Vendedor ${id ? 'atualizado' : 'criado'} com sucesso.` 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const deleteSeller = async (id: string) => {
    try {
      await apiRequest(`/api/sellers/${id}`, 'DELETE');
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: "Vendedor removido com sucesso." 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const saveSprint = async (data: any, id?: string) => {
    try {
      await apiRequest(
        id ? `/api/sprints/${id}` : '/api/sprints', 
        id ? 'PUT' : 'POST', 
        data
      );
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: `Sprint ${id ? 'atualizado' : 'criado'} com sucesso.` 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const deleteSprint = async (id: string) => {
    try {
      await apiRequest(`/api/sprints/${id}`, 'DELETE');
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: "Sprint removido com sucesso." 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const toggleSprint = async (sprint: DailySprint, is_active: boolean) => {
    try {
      await apiRequest(`/api/sprints/${sprint.id}/toggle`, 'PUT', { is_active });
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: `Sprint ${is_active ? 'ativado' : 'desativado'} com sucesso.` 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const saveMission = async (data: any, id?: string) => {
    try {
      await apiRequest(
        id ? `/api/missions/${id}` : '/api/missions', 
        id ? 'PUT' : 'POST', 
        data
      );
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: `Missão ${id ? 'atualizada' : 'criada'} com sucesso.` 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const deleteMission = async (id: string) => {
    try {
      await apiRequest(`/api/missions/${id}`, 'DELETE');
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: "Missão removida com sucesso." 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  const updateSettings = async (data: { sellers: Seller[], goals: any }) => {
    try {
      await apiRequest('/api/settings', 'PUT', data);
      await fetchData();
      toast({ 
        title: "Sucesso!", 
        description: "Configurações salvas com sucesso." 
      });
    } catch (error) {
      // Erro já tratado no apiRequest
    }
  };

  return (
    <AdminContext.Provider value={{
      sellers,
      missions,
      sprints,
      goals,
      isLoading,
      refetch: fetchData,
      saveSprint,
      deleteSprint,
      toggleSprint,
      saveSeller,
      deleteSeller,
      saveMission,
      deleteMission,
      updateSettings,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};