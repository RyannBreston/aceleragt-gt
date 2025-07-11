import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SalesValueGoals } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateSellerPrizes = (seller: Seller, goals: Goals) => {
  const prizes: Record<keyof Omit<Goals, 'salesValue' | 'gamification'>, number> = {
    salesValue: 0,
    ticketAverage: 0,
    pa: 0,
    points: 0,
  };
  const zeroedPrizes = {...prizes};

  // Rule: Must meet points 'metinha' to be eligible for any prize
  if ((seller.points + seller.extraPoints) < goals.points.metinha.threshold) {
    return { ...seller, prizes: zeroedPrizes, totalPrize: 0 };
  }

  const allCriteria: Array<keyof typeof prizes> = ['salesValue', 'ticketAverage', 'pa', 'points'];
  
  allCriteria.forEach(crit => {
      if (crit in goals && (crit === 'salesValue' || crit === 'ticketAverage' || crit === 'pa' || crit === 'points')) {
          const goalLevels = goals[crit];
          const sellerValue = crit === 'points' ? seller.points + seller.extraPoints : seller[crit];

          let tierPrize = 0;
          if (sellerValue >= goalLevels.lendaria.threshold && goalLevels.lendaria.threshold > 0) {
            tierPrize = goalLevels.lendaria.prize;
          } else if (sellerValue >= goalLevels.metona.threshold && goalLevels.metona.threshold > 0) {
            tierPrize = goalLevels.metona.prize;
          } else if (sellerValue >= goalLevels.meta.threshold && goalLevels.meta.threshold > 0) {
            tierPrize = goalLevels.meta.prize;
          } else if (sellerValue >= goalLevels.metinha.threshold && goalLevels.metinha.threshold > 0) {
            tierPrize = goalLevels.metinha.prize;
          }

          // Special case: Add performance bonus for sales on top of the tier prize
          if (crit === 'salesValue') {
              const salesGoals = goalLevels as SalesValueGoals;
              if (seller.salesValue >= salesGoals.lendaria.threshold && salesGoals.lendaria.threshold > 0 && salesGoals.performanceBonus && salesGoals.performanceBonus.per > 0) {
                  const excessSales = seller.salesValue - salesGoals.lendaria.threshold;
                  const bonusUnits = Math.floor(excessSales / salesGoals.performanceBonus.per);
                  tierPrize += bonusUnits * salesGoals.performanceBonus.prize;
              }
          }
          prizes[crit] = tierPrize;
      }
  });

  const totalPrize = Object.values(prizes).reduce((sum, p) => sum + p, 0);

  return { ...seller, prizes, totalPrize };
};
