import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SellerWithPrizes, MetricGoals, GoalLevel } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PrizeMetric = 'salesValue' | 'ticketAverage' | 'pa' | 'points';

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

  const metrics: PrizeMetric[] = ['salesValue', 'ticketAverage', 'pa', 'points'];

  metrics.forEach(metric => {
    const sellerValue = metric === 'points' 
      ? (sellerData.points || 0) + (sellerData.extraPoints || 0)
      : (sellerData[metric as keyof Seller] as number) || 0;
      
    const metricGoals = goals[metric] as MetricGoals;
    if (!metricGoals) return;

    const levels: (keyof MetricGoals)[] = ['lendaria', 'metona', 'meta', 'metinha'];
    for (const level of levels) {
      const goalLevel = metricGoals[level] as GoalLevel;
      if (goalLevel && sellerValue >= goalLevel.threshold) {
        prizes[metric] = goalLevel.prize;
        break; 
      }
    }
  });

  const totalPrize = Object.values(prizes).reduce((sum, prize) => sum + prize, 0);

  const rankedSellers = [...sellers].sort((a, b) => b.salesValue - a.salesValue);
  const rank = rankedSellers.findIndex((s) => s.id === sellerData.id) + 1;

  return {
    ...sellerData,
    prizes,
    totalPrize,
    rank,
    teamBonusApplied: false, 
    topScorerBonus: 0,
  };
};
