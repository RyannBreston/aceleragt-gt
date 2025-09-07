'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { calculateSellerPrizes } from '@/lib/client-utils';
import type { Seller, Goals, Mission, DailySprint, SellerWithPrizes } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SellerContextType {
  sellers: Seller[]; // <-- Crucial: Armazena a lista de TODOS os vendedores para o ranking
  goals: Goals | null;
  missions: Mission[];
  currentSeller: SellerWithPrizes | null;
  activeSprint: DailySprint | null;
  isLoading: boolean;
  isSeller: boolean;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerWithPrizes | null>(null);
  const [activeSprint, setActiveSprint] = useState<DailySprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = session?.user?.id;
  const isSeller = status === 'authenticated' && session?.user?.role === 'seller';

  useEffect(() => {
    const fetchData = async () => {
      if (!isSeller) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Busca todos os dados necessários para a experiência do vendedor
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

        setSellers(sellersData); // <-- Armazena a lista completa de vendedores
        setGoals(goalsData);
        setMissions(missionsData);
        
        const active = sprintsData.find((sprint: DailySprint) => sprint.is_active && sprint.participant_ids.includes(userId!));
        setActiveSprint(active || null);

      } catch (error) {
        if (error instanceof Error) {
          toast({ variant: 'destructive', title: 'Erro de Rede', description: error.message });
        } else {
          toast({ variant: 'destructive', title: 'Erro de Rede', description: 'Ocorreu um erro desconhecido.' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchData();
    }
  }, [isSeller, status, userId, toast]);

  useEffect(() => {
    // Calcula os dados específicos do vendedor logado
    if (userId && sellers.length > 0 && goals && activeSprint) {
      const sellerData = sellers.find(s => s.id === userId);
      if (sellerData) {
        const sellerWithPrizes = calculateSellerPrizes(sellerData, sellers, goals);
        setCurrentSeller(sellerWithPrizes);
      }
    } else {
      setCurrentSeller(null);
    }
  }, [userId, sellers, goals, activeSprint]);

  const contextValue: SellerContextType = useMemo(() => ({
    sellers, goals, missions, currentSeller, activeSprint,
    isLoading: isLoading || status === 'loading',
    isSeller,
  }), [sellers, goals, missions, currentSeller, activeSprint, isLoading, status, isSeller]);

  return <SellerContext.Provider value={contextValue}>{children}</SellerContext.Provider>;
};

export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (context === undefined) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};