import type { Goals, Seller, Mission } from './types';

// --- CORRIGIDO: Exportando os dados que estavam faltando ---
export const initialSellers: Seller[] = [];
export const initialMissions: Mission[] = [];

// Corrigindo a estrutura de 'gamification' para usar booleanos
export const initialGoals: Goals = {
  salesValue: {
    metinha: { threshold: 10000, prize: 50 },
    meta: { threshold: 15000, prize: 100 },
    metona: { threshold: 20000, prize: 200 },
    lendaria: { threshold: 25000, prize: 300 },
    performanceBonus: { per: 1000, prize: 50 },
    topScorerPrize: 200,
  },
  ticketAverage: {
    metinha: { threshold: 100, prize: 50 },
    meta: { threshold: 120, prize: 75 },
    metona: { threshold: 150, prize: 100 },
    lendaria: { threshold: 200, prize: 150 },
  },
  pa: {
    metinha: { threshold: 2.5, prize: 50 },
    meta: { threshold: 3.0, prize: 75 },
    metona: { threshold: 3.5, prize: 100 },
    lendaria: { threshold: 4.0, prize: 150 },
  },
  points: {
    metinha: { threshold: 500, prize: 50 },
    meta: { threshold: 1000, prize: 75 },
    metona: { threshold: 1500, prize: 100 },
    lendaria: { threshold: 2000, prize: 150 },
  },
  gamification: {
    academia: true,
    quiz: true,
    missions: true,
    ofertas: true,
    loja: true,
    ranking: true,
    sprints: true,
    escala: true,
  },
};
