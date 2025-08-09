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

// --- CORREÇÃO APLICADA AQUI ---
export interface PerformanceBonus {
    per: number;
    prize: number;
}

export interface SalesValueGoals {
    metinha: GoalLevel;
    meta: GoalLevel;
    metona: GoalLevel;
    lendaria: GoalLevel;
    performanceBonus?: PerformanceBonus; // Propriedade adicionada como opcional
}

export interface GamificationSettings {
    missions: boolean;
    academia: boolean;
    quiz: boolean;
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
    quiz: QuizQuestion[];
    points: number;
    dificuldade: CourseDifficulty;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation:string;
}

export interface Quiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
}

export interface QuizResult {
    quizId: string;
    quizTitle: string;
    sellerId: string;
    sellerName: string;
    timestamp: Date;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
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