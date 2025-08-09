import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// ====================================================================
// TIPOS E ESQUEMAS PARA OS FLUXOS DE IA
// ====================================================================

export const AnalyzeSalesTrendsInputSchema = z.object({
  salesData: z.string(),
  timeFrame: z.string(),
});
export const AnalyzeSalesTrendsOutputSchema = z.object({
  summary: z.string().describe('Um resumo geral das tendências de vendas.'),
  topProducts: z.string().describe('Os produtos ou categorias com melhor desempenho.'),
  insights: z.string().describe('Principais conclusões e sugestões acionáveis.'),
});
export type AnalyzeSalesTrendsInput = z.infer<typeof AnalyzeSalesTrendsInputSchema>;
export type AnalyzeSalesTrendsOutput = z.infer<typeof AnalyzeSalesTrendsOutputSchema>;

export const GenerateCourseInputSchema = z.object({
    topic: z.string(),
});
export const GenerateCourseOutputSchema = z.object({
    title: z.string().describe("Um título criativo e relevante para o curso."),
    content: z.string().describe("O conteúdo educacional do curso em formato Markdown."),
    quiz: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctAnswerIndex: z.number().min(0).max(3),
        explanation: z.string().describe("Uma breve explicação sobre a resposta correta."),
    })).describe("Um quiz com pelo menos 3 perguntas para testar o conhecimento.")
});
export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;
export type GenerateCourseOutput = z.infer<typeof GenerateCourseOutputSchema>;

export const GenerateQuizInputSchema = z.object({
  topic: z.string(),
  numQuestions: z.number().min(1).max(10),
});
export const GenerateQuizOutputSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswerIndex: z.number().min(0).max(3),
      explanation: z.string(),
    })
  ),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export const PasswordResetInputSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
});
export const PasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type PasswordResetInput = z.infer<typeof PasswordResetInputSchema>;
export type PasswordResetOutput = z.infer<typeof PasswordResetOutputSchema>;

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

export interface SalesValueGoals {
    metinha: GoalLevel;
    meta: GoalLevel;
    metona: GoalLevel;
    lendaria: GoalLevel;
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
    date: string;
    score: number;
    total: number;
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

export interface CycleSnapshot {
    id: string;
    endDate: Timestamp;
    sellers: Seller[];
    goals: Goals;
}