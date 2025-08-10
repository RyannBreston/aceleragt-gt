import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Goals, Seller } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PrizeResult = {
  salesValue: number;
  ticketAverage: number;
  pa: number;
  points: number;
};

/**
 * Calculates the prize for a single metric based on performance and goal tiers.
 * The highest achieved tier's prize is awarded.
 */
function calculateMetricPrize(
  sellerValue: number,
  metricGoals: Goals[keyof Goals]
): number {
  if (!sellerValue || !metricGoals || typeof metricGoals !== 'object') {
    return 0;
  }

  let bestPrize = 0;
  // Tiers should be checked from highest to lowest
  const tiers: (keyof typeof metricGoals)[] = [
    "lendaria",
    "metona",
    "meta",
    "metinha",
  ];

  for (const tier of tiers) {
    const goalTier = metricGoals[tier as keyof typeof metricGoals] as { threshold?: number; prize?: number; };
    if (goalTier?.threshold && sellerValue >= goalTier.threshold) {
      bestPrize = goalTier.prize || 0;
      break; // Found the highest tier, so we can stop.
    }
  }

  // Handle special performance bonus for salesValue
  if ('performanceBonus' in metricGoals && metricGoals.performanceBonus?.per && metricGoals.performanceBonus?.prize) {
      const bonusCount = Math.floor(sellerValue / metricGoals.performanceBonus.per);
      bestPrize += bonusCount * (metricGoals.performanceBonus.prize || 0);
  }


  return bestPrize;
}

/**
 * Calculates all prizes for a given seller based on their performance and the defined goals.
 * This is a recreation of the function that was deleted.
 */
export function calculateSellerPrizes(
  seller: Seller,
  goals: Goals
): { prizes: PrizeResult; totalPrize: number } {
  const prizes: PrizeResult = {
    salesValue: calculateMetricPrize(seller.salesValue || 0, goals.salesValue),
    ticketAverage: calculateMetricPrize(
      seller.ticketAverage || 0,
      goals.ticketAverage
    ),
    pa: calculateMetricPrize(seller.pa || 0, goals.pa),
    points: calculateMetricPrize(seller.points || 0, goals.points),
  };

  const totalPrize =
    Object.values(prizes).reduce((sum, prize) => sum + prize, 0) +
    (seller.extraPoints || 0);

  return { prizes, totalPrize };
}
