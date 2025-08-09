import type { Seller, Goals, Mission } from './types';

// Lista de vendedores inicial vazia. Os vendedores serão adicionados através do painel de admin.
export const initialSellers: Seller[] = [];

// Missões iniciais vazias.
export const initialMissions: Mission[] = [];

// Metas iniciais com valores padrão ou zerados.
// Estes valores devem ser configurados pelo administrador na primeira utilização.
export const initialGoals: Goals = {
  salesValue: {
    metinha: { threshold: 10000, prize: 100 },
    meta: { threshold: 15000, prize: 150 },
    metona: { threshold: 20000, prize: 200 },
    lendaria: { threshold: 25000, prize: 300 },
    performanceBonus: { per: 1000, prize: 50 },
  },
  ticketAverage: {
    metinha: { threshold: 100, prize: 50 },
    meta: { threshold: 120, prize: 75 },
    metona: { threshold: 150, prize: 100 },
    lendaria: { threshold: 200, prize: 150 },
  },
  pa: {
    metinha: { threshold: 2.2, prize: 50 },
    meta: { threshold: 2.5, prize: 75 },
    metona: { threshold: 2.8, prize: 100 },
    lendaria: { threshold: 3.0, prize: 150 },
  },
  points: {
    metinha: { threshold: 500, prize: 50 },
    meta: { threshold: 1000, prize: 75 },
    metona: { threshold: 1500, prize: 100 },
    lendaria: { threshold: 2000, prize: 150 },
    topScorerPrize: 200,
  },
  gamification: {
    course: {
      Fácil: 10,
      Médio: 25,
      Difícil: 50,
    },
