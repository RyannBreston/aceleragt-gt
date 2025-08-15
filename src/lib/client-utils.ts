import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SellerWithPrizes, MetricGoals, GoalLevel, DailySprint } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PrizeMetric = 'salesValue' | 'ticketAverage' | 'pa' | 'points';

/**
 * Calcula os prémios de um vendedor com base nas metas e na corridinha ativa.
 */
export const calculateSellerPrizes = (
  sellerData: Seller,
  sellers: Seller[],
  goals: Goals,
  activeSprint: DailySprint | null
): SellerWithPrizes => {

  // 1. Calcula o prémio da Corridinha (Sprint)
  let sprintPrize = 0;
  if (activeSprint && activeSprint.participantIds.includes(sellerData.id)) {
    const achievedTiers = activeSprint.sprintTiers
      .filter(tier => sellerData.salesValue >= tier.goal)
      .sort((a, b) => b.goal - a.goal); // Ordena do maior para o menor

    if (achievedTiers.length > 0) {
      sprintPrize = achievedTiers[0].prize; // Pega o prémio do nível mais alto atingido
    }
  }

  // 2. Calcula os prémios das Metas de Performance
  const prizes: Record<PrizeMetric, number> = {
    salesValue: 0,
    ticketAverage: 0,
    pa: 0,
    points: 0,
  };

  const metrics: PrizeMetric[] = ['salesValue', 'ticketAverage', 'pa', 'points'];

  metrics.forEach(metric => {
    const sellerValue = (sellerData[metric as keyof Seller] as number) || 0;
    const metricGoals = goals[metric] as MetricGoals;
    if (!metricGoals) return;

    const levels: (keyof MetricGoals)[] = ['lendaria', 'metona', 'meta', 'metinha'];
    for (const level of levels) {
      const goalLevel = metricGoals[level] as GoalLevel;
      if (goalLevel && goalLevel.threshold > 0 && sellerValue >= goalLevel.threshold) {
        prizes[metric] = goalLevel.prize || 0;
        break; 
      }
    }
  });

  // 3. Calcula o Prémio Total
  const totalPrizeFromMetrics = Object.values(prizes).reduce((sum, prize) => sum + prize, 0);
  const totalPrize = totalPrizeFromMetrics + sprintPrize;

  // 4. Calcula o Ranking (exemplo, pode ser ajustado)
  const rank = [...sellers].sort((a, b) => b.salesValue - a.salesValue).findIndex(s => s.id === sellerData.id) + 1;

  return {
    ...sellerData,
    prizes,
    sprintPrize,
    totalPrize,
    rank,
    teamBonusApplied: false,
    topScorerBonus: 0,
  };
};
