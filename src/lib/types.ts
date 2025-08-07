import { z } from 'zod';

// ====================================================================
// ✅ ESQUEMAS E TIPOS PARA OS FLUXOS DE IA (Adicionados)
// ====================================================================

// Para a Análise de Vendas (Insights com IA)
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

// Para a Geração de Cursos da Academia
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

// Para a Recuperação de Senha
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
  createdAt?: any;
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
}

export interface Goals {
    salesValue: SalesValueGoals;
    ticketAverage: SalesValueGoals;
    pa: SalesValueGoals;
    points: SalesValueGoals;
    gamification: GamificationSettings;
}

// ... (e todos os outros tipos que você já tinha, como Course, Offer, PrizeItem, DailySprint, etc.)
export interface Course {
    id?: string;
    title: string;
    content: string;
    quiz: QuizQuestion[];
    points: number;
    dificuldade: 'Fácil' | 'Médio' | 'Difícil';
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

export interface DailySprint {
    id: string;
    title: string;
    sprintTiers: { goal: number; prizePoints: number }[];
    createdAt: { seconds: number, nanoseconds: number };
    participantIds: string[];
    isActive: boolean;
}

// ... adicione outros tipos que possam estar em falta