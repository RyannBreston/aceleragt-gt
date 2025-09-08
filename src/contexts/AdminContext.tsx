'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailySprint, Mission, Seller, Goal } from '@/lib/types';

// Definindo a estrutura dos dados que o contexto irá fornecer
interface AdminContextType {
  sellers: Seller[] | null;
  missions: Mission[] | null;
  sprints: DailySprint[] | null;
  goals: Goal | null;
  isLoading: boolean;
  refetch: () => void; // Função para recarregar os dados

  // Funções para Sprints
  saveSprint: (data: any, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (sprint: DailySprint, isActive: boolean) => Promise<void>;

  // Funções para Vendedores (Sellers)
  saveSeller: (data: any, id?: string) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;

  // Funções para Missões (Missions)
  saveMission: (data: any, id?: string) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [sprints, setSprints] = useState<DailySprint[] | null>(null);
  const [goals, setGoals] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const response = await fetch('/api/admin');
      if (!response.ok) {
        throw new Error('A resposta da rede não foi boa');
      }
      const data = await response.json();
      setSellers(data.sellers);
      setMissions(data.missions);
      setSprints(data.sprints);
      setGoals(data.goals);
    } catch (error) {
      console.error('Falha ao carregar dados do admin:', error);
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

  // --- Funções Genéricas para API ---
  const apiRequest = async (url: string, method: string, body?: any) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Falha na operação' }));
      throw new Error(errorData.message);
    }
    return response.json();
  };


  // --- Lógica de Vendedores (Sellers) ---
  const saveSeller = async (data: any, id?: string) => {
    // Para criar um vendedor, usamos a rota /api/register
    const url = id ? `/api/sellers/${id}` : '/api/register';
    const method = id ? 'PUT' : 'POST';
    // Garante que a role seja enviada, especialmente para novos usuários
    const body = { ...data, role: 'seller' }; 
    await apiRequest(url, method, body);
    await fetchData(); // Recarrega tudo
  };

  const deleteSeller = async (id: string) => {
    await apiRequest(`/api/sellers/${id}`, 'DELETE');
    await fetchData();
  };

  // --- Lógica de Sprints ---
  const saveSprint = async (data: any, id?: string) => {
    const url = id ? `/api/sprints/${id}` : '/api/sprints';
    const method = id ? 'PUT' : 'POST';
    await apiRequest(url, method, data);
    await fetchData();
  };

  const deleteSprint = async (id: string) => {
    await apiRequest(`/api/sprints/${id}`, 'DELETE');
    await fetchData();
  };

  const toggleSprint = async (sprint: DailySprint, is_active: boolean) => {
    await apiRequest(`/api/sprints/${sprint.id}/toggle`, 'PUT', { is_active });
    await fetchData();
  };

  // --- Lógica de Missões (Missions) ---
  const saveMission = async (data: any, id?: string) => {
    const url = id ? `/api/missions/${id}` : '/api/missions';
    const method = id ? 'PUT' : 'POST';
    await apiRequest(url, method, data);
    await fetchData();
  };

  const deleteMission = async (id: string) => {
    await apiRequest(`/api/missions/${id}`, 'DELETE');
    await fetchData();
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
