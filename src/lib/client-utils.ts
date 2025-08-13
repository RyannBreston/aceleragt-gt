import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SellerWithPrizes, MetricGoals, GoalLevel } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PrizeMetric = 'salesValue' | 'ticketAverage' | 'pa' | 'points';

/**
 * Calcula os prémios de um vendedor com base nas metas definidas.
 * A lógica agora é direta:
 * 1. O total de pontos é a soma simples dos pontos base e pontos extras.
 * 2. Com base nesse total, e nos valores das outras métricas, calcula-se o prémio monetário para cada categoria.
 */
export const calculateSellerPrizes = (
  sellerData: Seller,
  sellers: Seller[],
  goals: Goals
): SellerWithPrizes => {

  const prizes: Record<PrizeMetric, number> = {
    salesValue: 0,
    ticketAverage: 0,
    pa: 0,
    points: 0,
  };

  // O total de pontos é a soma direta dos pontos de performance e os pontos extras (corridinha, etc.)
  const totalPoints = (sellerData.points || 0) + (sellerData.extraPoints || 0);

  const metrics: PrizeMetric[] = ['salesValue', 'ticketAverage', 'pa', 'points'];

  metrics.forEach(metric => {
    // Usa o total de pontos consolidado para a métrica de pontos
    const sellerValue = metric === 'points' 
      ? totalPoints
      : (sellerData[metric as keyof Seller] as number) || 0;
      
    const metricGoals = goals[metric] as MetricGoals;
    if (!metricGoals) return;

    const levels: (keyof MetricGoals)[] = ['lendaria', 'metona', 'meta', 'metinha'];
    for (const level of levels) {
      const goalLevel = metricGoals[level] as GoalLevel;
      // Verifica se o valor do vendedor atinge o limiar da meta para conceder o prémio
      if (goalLevel && goalLevel.threshold > 0 && sellerValue >= goalLevel.threshold) {
        prizes[metric] = goalLevel.prize || 0;
        break; // Para no prémio do nível mais alto atingido
      }
    }
  });

  const totalPrizeFromMetrics = Object.values(prizes).reduce((sum, prize) => sum + prize, 0);

  const rankedSellers = [...sellers].sort((a, b) => b.salesValue - a.salesValue);
  const rank = rankedSellers.findIndex((s) => s.id === sellerData.id) + 1;

  // Retorna os dados do vendedor com os pontos totais calculados para exibição
  const finalSellerData = {
      ...sellerData,
      points: totalPoints,
  };

  return {
    ...finalSellerData,
    prizes: prizes,
    totalPrize: totalPrizeFromMetrics,
    rank,
    teamBonusApplied: false,
    topScorerBonus: 0,
  };
};
