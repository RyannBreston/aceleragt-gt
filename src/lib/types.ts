// src/lib/types.ts

import { Timestamp } from 'firebase/firestore';

// ====================================================================
// TIPOS E ESQUEMAS PARA UTILIZADORES E GAMIFICAÇÃO
// ====================================================================

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt?: Timestamp;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  role: 'seller';
  salesValue: number;
  ticketAverage: number;
  pa: number;
  points: number;
  extraPoints: number;
  completedCourseIds?: string[];
  workSchedule?: Record<string, string>;
  createdAt?: Timestamp;
}

export interface GoalLevel {
    threshold: number;
    prize: number;
}

export interface PerformanceBonus {
    per: number;
    prize: number;
}

export interface SalesValueGoals {
    metinha: GoalLevel;
    meta: GoalLevel;
    metona: GoalLevel;
    lendaria: GoalLevel;
    performanceBonus?: PerformanceBonus;
    topScorerPrize?: number;
}

// --- CORREÇÃO FINAL APLICADA AQUI ---
export type PointsByDifficulty = {
    Fácil: number;
    Médio: number;
    Difícil: number;
};

export interface GamificationSettings {
    missions: boolean;
    academia: { // Supondo que a academia também tenha pontos por dificuldade
        Fácil: number;
        Médio: number;
        Difícil: number;
    };
    ofertas: boolean;
    loja: boolean;
    ranking: boolean;
    sprints: boolean;
}

export interface Goals {
    salesValue: SalesValueGoals;
    ticketAverage: SalesValueGoals;
    pa: SalesValueGoals;
    points: SalesValueGoals;
    gamification: GamificationSettings;
}

export type CourseDifficulty = 'Fácil' | 'Médio' | 'Difícil';

export interface Course {
    id?: string;
    title: string;
    content: string;
    points: number;
    dificuldade: CourseDifficulty;
}

export interface DailySprint {
    id: string;
    title: string;
    sprintTiers: { goal: number; points: number }[];
    createdAt: { seconds: number, nanoseconds: number };
    participantIds: string[];
    isActive: boolean;
}

export interface PrizeItem {
    id: string;
    name: string;
    description: string;
    points: number;
    stock?: number | null;
    imageUrl: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Offer {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    originalPrice?: number;
    promotionalPrice: number;
    startDate: Date;
    expirationDate: Date;
    isActive: boolean;
    category: string;
    productCode?: string;
    reference?: string;
    isFlashOffer?: boolean;
    isBestSeller?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface SalesEntry {
  id: string;
  sellerId: string;
  sellerName: string;
  date: Date;
  salesValue: number;
  ticketAverage: number;
  productsPerService: number;
}

export interface CycleSnapshot {
  id: string;
  endDate: Timestamp;
  sellers: Seller[];
  goals: Goals;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'individual' | 'team';
  goal: number;
  metric: 'salesValue' | 'ticketAverage' | 'pa' | 'points';
  isActive: boolean;
  deadline: Date;
}
