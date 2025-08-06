import { z } from 'zod';
import { type User as FirebaseUser } from 'firebase/auth';

// ====================================================================
// TIPOS E ESQUEMAS PARA AUTENTICAÇÃO E UTILIZADORES
// ====================================================================

export const PasswordResetInputSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
});
export const PasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type PasswordResetInput = z.infer<typeof PasswordResetInputSchema>;
export type PasswordResetOutput = z.infer<typeof PasswordResetOutputSchema>;

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
  createdAt?: any; // Mantido como 'any' para compatibilidade com Timestamp do Firebase
}

export interface Admin {
    id: string;
    name: string;
    email: string;
    role: 'admin';
}

// ====================================================================
// TIPOS E ESQUEMAS PARA METAS E GAMIFICAÇÃO
// ====================================================================

export interface GoalLevel {
    threshold: number;
    prize: number;
}

export interface SalesValueGoals {
    metinha: GoalLevel;
    meta: GoalLevel;
    metona: GoalLevel;
    lendaria: GoalLevel;
    performanceBonus?: {
        per: number;
        prize: number;
    }
}

export interface GamificationSettings {
    missions: boolean;
    academia: boolean;
    quiz: boolean;
    ofertas: boolean;
    loja: boolean;
    ranking: boolean;
}

export interface Goals {
    salesValue: SalesValueGoals;
    ticketAverage: SalesValueGoals;
    pa: SalesValueGoals;
    points: SalesValueGoals;
    gamification: GamificationSettings;
}

export interface CycleSnapshot {
    id: string;
    endDate: any; // Timestamp do Firebase
    sellers: Seller[];
    goals: Goals;
}

// ====================================================================
// TIPOS E ESQUEMAS PARA MÓDULOS (ACADEMIA, QUIZ, OFERTAS, ETC.)
// ====================================================================

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

export interface Course {
    id?: string;
    title: string;
    content: string;
    quiz: QuizQuestion[];
    points: number;
    dificuldade: 'Fácil' | 'Médio' | 'Difícil';
}

export interface Offer {
    id: string;
    name: string;
    description?: string;
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
    createdAt?: any;
    updatedAt?: any;
}

export interface PrizeItem {
    id: string;
    name: string;
    description: string;
    points: number;
    stock: number | null; // null para ilimitado
    imageUrl: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    points: number;
    // ... outros campos que você possa precisar
}

// ====================================================================
// TIPOS E ESQUEMAS PARA A CORRIDINHA DIÁRIA
// ====================================================================

export interface SprintTier {
    goal: number;
    prizePoints: number;
}

export interface DailySprint {
    id: string;
    title: string;
    sprintTiers: SprintTier[];
    createdAt: { seconds: number, nanoseconds: number };
    participantIds: string[];
    isActive: boolean;
}