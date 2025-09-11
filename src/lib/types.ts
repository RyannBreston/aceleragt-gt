// --- TIPOS DE DADOS BASE DO BANCO DE DADOS (NEON) ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller';
}

export interface Seller extends User {
  sales_value?: number;
  ticket_average?: number;
  pa?: number;
  points?: number;
  extra_points?: number;
  storeId?: string; // ID da loja à qual o vendedor pertence
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  points: number;
  type?: string;
  goal?: number;
  course_id?: string;
}

export interface DailySprint {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string; // ou Date
  participant_ids: string[];
  sprint_tiers: { goal: number; prize: number }[];
}

// --- TIPO PARA AS METAS E CONFIGURAÇÕES DE GAMIFICAÇÃO ---

export interface GoalLevel {
  threshold?: number;
  prize?: number;
}

export interface PerformanceBonus {
    per?: number;
    prize?: number;
}

export interface MetricGoals {
    metinha?: GoalLevel;
    meta?: GoalLevel;
    metona?: GoalLevel;
    lendaria?: GoalLevel;
    performanceBonus?: PerformanceBonus;
    topScorerPrize?: number;
}

export interface GamificationSettings {
    missions: boolean;
    academia: boolean;
    quiz: boolean;
    ofertas: boolean;
    loja: boolean;
    ranking: boolean;
    sprints: boolean;
    escala: boolean;
}

export interface Goals {
  id: 'main';
  // Metas principais (opcional, pois podem estar dentro de 'data')
  monthly_goal?: number;
  pa_goal?: number;
  ticket_goal?: number;
  // Objeto 'data' para armazenar a estrutura complexa do formulário de configurações
  data?: {
    salesValue: MetricGoals;
    ticketAverage: MetricGoals;
    pa: MetricGoals;
    points: MetricGoals;
    gamification: GamificationSettings;
    teamGoalBonus?: number;
  }
}

// --- TIPOS DERIVADOS E PARA OS CONTEXTOS ---

export interface Admin extends User {
  role: 'admin';
}

export interface PrizeDetail {
  reason: string;
  amount: number;
  level?: string;
}

export interface SellerWithPrizes extends Seller {
  prizes: {
    total: number;
    details: PrizeDetail[];
  };
}

// Tipo para o histórico, se vier a ser implementado
export interface CycleSnapshot {
    id: string;
    endDate: Date;
    sellers: Seller[];
    goals: Goals;
}