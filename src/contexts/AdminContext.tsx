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
  // Funções para manipular os dados (save, delete, toggle) serão adicionadas aqui
  saveSprint: (data: any, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (sprint: DailySprint, isActive: boolean) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [sprints, setSprints] = useState<DailySprint[] | null>(null);
  const [goals, setGoals] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSellers(data.sellers);
      setMissions(data.missions);
      setSprints(data.sprints);
      setGoals(data.goals);
    } catch (error) {
      console.error('Falha ao carregar dados do admin:', error);
      // Em caso de erro, definimos os dados como arrays vazios para evitar quebras
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

  // Funções para manipular Sprints (exemplo)
  const saveSprint = async (data: any, id?: string) => {
    const url = id ? `/api/sprints/${id}` : '/api/sprints';
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Falha ao salvar a corridinha');
    await fetchData(); // Recarrega os dados após a alteração
  };

  const deleteSprint = async (id: string) => {
    const response = await fetch(`/api/sprints/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Falha ao excluir a corridinha');
    await fetchData();
  };

  const toggleSprint = async (sprint: DailySprint, is_active: boolean) => {
    const response = await fetch(`/api/sprints/${sprint.id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    });
    if (!response.ok) throw new Error('Falha ao alterar o estado da corridinha');
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
      toggleSprint 
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
