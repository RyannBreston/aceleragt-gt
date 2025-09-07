'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { calculateSellerPrizes } from '@/lib/client-utils';
import type { Seller, Goals, Mission, CycleSnapshot, DailySprint, Admin, SellerWithPrizes } from '@/lib/types';

interface SellerContextType {
  sellers: Seller[];
  goals: Goals | null;
  missions: Mission[];
  currentSeller: SellerWithPrizes | null;
  cycleHistory: CycleSnapshot[];
  activeSprint: DailySprint | null;
  isAuthReady: boolean;
  userId: string | null;
  isSeller: boolean;
  admin: Admin | null;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export const SellerProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerWithPrizes | null>(null);
  const [activeSprint, setActiveSprint] = useState<DailySprint | null>(null);

  const userId = useMemo(() => session?.user?.id, [session]);
  const isSeller = useMemo(() => status === 'authenticated' && session?.user?.role === 'seller', [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      // Apenas busca os dados se for um vendedor autenticado
      if (!isSeller) return;

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
        
        // Encontra a corridinha ativa para este vendedor específico
        const active = sprintsData.find((sprint: DailySprint) => sprint.is_active && sprint.participant_ids.includes(userId));
        setActiveSprint(active || null);

      } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [isSeller, status, userId]);

  useEffect(() => {
    // Calcula os dados do vendedor atual sempre que os dados base mudarem
    if (userId && sellers.length > 0 && goals) {
      const sellerData = sellers.find(s => s.id === userId);
      if (sellerData) {
        const sellerWithPrizes = calculateSellerPrizes(sellerData, sellers, goals, activeSprint);
        setCurrentSeller(sellerWithPrizes);
      }
    } else {
      setCurrentSeller(null);
    }
  }, [userId, sellers, goals, activeSprint]);

  const contextValue: SellerContextType = useMemo(() => ({
    sellers,
    goals,
    missions,
    currentSeller,
    activeSprint,
    userId,
    isSeller,
    isAuthReady: status !== 'loading',
    admin: null, // Não aplicável no contexto de vendedor
    cycleHistory: [], // Não aplicável no contexto de vendedor
  }), [sellers, goals, missions, currentSeller, activeSprint, userId, isSeller, status]);

  return <SellerContext.Provider value={contextValue}>{children}</SellerContext.Provider>;
};

export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (context === undefined) {
    throw new Error('useSellerContext deve ser usado dentro de um SellerProvider');
  }
  return context;
};