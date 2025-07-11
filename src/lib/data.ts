import type { Seller, Goals, Mission } from './types';

// Data for testing and analysis purposes.
// This data will be cleared before final publication.

export const sellersData: Seller[] = [
  { id: '1', name: 'Rose', nickname: 'rose', email: 'rose@example.com', password: '123', salesValue: 32541.50, ticketAverage: 185.30, pa: 2.2, points: 1250, extraPoints: 50, hasCompletedQuiz: true, lastCourseCompletionDate: '2024-06-28' },
  { id: '2', name: 'Joisse', nickname: 'joisse', email: 'joisse@example.com', password: '123', salesValue: 38112.75, ticketAverage: 195.80, pa: 2.6, points: 1800, extraPoints: 100, hasCompletedQuiz: false },
  { id: '3', name: 'Mercia', nickname: 'mercia', email: 'mercia@example.com', password: '123', salesValue: 41580.00, ticketAverage: 205.10, pa: 2.1, points: 2100, extraPoints: 0, hasCompletedQuiz: true, lastCourseCompletionDate: '2024-06-29' },
  { id: '4', name: 'Thays', nickname: 'thays', email: 'thays@example.com', password: '123', salesValue: 28950.20, ticketAverage: 170.40, pa: 1.9, points: 800, extraPoints: 200, hasCompletedQuiz: false },
  { id: '5', name: 'Val', nickname: 'val', email: 'val@example.com', password: '123', salesValue: 45234.90, ticketAverage: 215.90, pa: 2.9, points: 2500, extraPoints: 150, hasCompletedQuiz: true, lastCourseCompletionDate: '2024-06-29' },
  { id: '6', name: 'Dajila', nickname: 'dajila', email: 'dajila@example.com', password: '123', salesValue: 36789.00, ticketAverage: 188.60, pa: 2.4, points: 1600, extraPoints: 0, hasCompletedQuiz: false },
];

export const goalsData: Goals = {
  salesValue: {
    metinha: { threshold: 30000, prize: 200 },
    meta: { threshold: 35000, prize: 250 },
    metona: { threshold: 40000, prize: 300 },
    lendaria: { threshold: 45000, prize: 400 },
    performanceBonus: { per: 1000, prize: 50 },
  },
  ticketAverage: {
    metinha: { threshold: 180, prize: 25 },
    meta: { threshold: 190, prize: 50 },
    metona: { threshold: 200, prize: 75 },
    lendaria: { threshold: 210, prize: 100 },
  },
  pa: {
    metinha: { threshold: 2.0, prize: 25 },
    meta: { threshold: 2.2, prize: 50 },
    metona: { threshold: 2.5, prize: 75 },
    lendaria: { threshold: 2.8, prize: 100 },
  },
  points: {
    metinha: { threshold: 1000, prize: 25 },
    meta: { threshold: 1500, prize: 50 },
    metona: { threshold: 2000, prize: 75 },
    lendaria: { threshold: 2500, prize: 100 },
    topScorerPrize: 100,
  },
  gamification: {
    course: { 'Fácil': 50, 'Médio': 100, 'Difícil': 150 },
    quiz: { 'Fácil': 10, 'Médio': 20, 'Difícil': 30 },
  }
};

export const missionsData: Mission[] = [
  {
    id: '1',
    name: 'Vendedor do Mês',
    description: 'Atingir o topo do ranking de vendas no final do mês.',
    rewardValue: 500,
    rewardType: 'points',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  },
  {
    id: '2',
    name: 'Especialista em PA',
    description: 'Manter um PA (Produtos por Atendimento) acima de 2.8 por uma semana.',
    rewardValue: 250,
    rewardType: 'points',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
   {
    id: '3',
    name: 'Mestre dos Quizzes',
    description: 'Completar 3 quizzes com uma pontuação perfeita.',
    rewardValue: 150,
    rewardType: 'points',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  },
];
