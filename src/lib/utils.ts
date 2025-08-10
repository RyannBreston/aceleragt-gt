import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, MetricGoals } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateSellerPrizes = (
    seller: Seller,
    allSellers: Seller[],
    goals: Goals | null
) => {
    const prizes: Record<keyof Omit<Goals, 'gamification'>, number> = {
        salesValue: 0,
        ticketAverage: 0,
        pa: 0,
        points: 0,
    };
    const zeroedPrizes = {...prizes};

    if (!goals || !goals.points) {
        return { ...seller, prizes: zeroedPrizes, totalPrize: 0, teamBonusApplied: false, topScorerBonus: 0 };
    }

    if ((seller.points + seller.extraPoints) < goals.points.metinha.threshold) {
        return { ...seller, prizes: zeroedPrizes, totalPrize: 0, teamBonusApplied: false, topScorerBonus: 0 };
    }

    const allCriteria: Array<keyof typeof prizes> = ['salesValue', 'ticketAverage', 'pa', 'points'];
    
    allCriteria.forEach(crit => {
        if (crit in goals) {
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

            const metricGoals = goalLevels as MetricGoals;
            if (sellerValue >= metricGoals.lendaria.threshold && metricGoals.lendaria.threshold > 0 && metricGoals.performanceBonus && metricGoals.performanceBonus.per > 0) {
                const excessValue = sellerValue - metricGoals.lendaria.threshold;
                const bonusUnits = Math.floor(excessValue / metricGoals.performanceBonus.per);
                tierPrize += bonusUnits * metricGoals.performanceBonus.prize;
            }
            prizes[crit] = tierPrize;
        }
    });

    let totalPrize = Object.values(prizes).reduce((sum, p) => sum + p, 0);
    
    let teamBonusApplied = false;
    let topScorerBonus = 0;

    const teamGoalMet = allSellers.length > 1 && allSellers.every(s => s.salesValue >= goals.salesValue.metinha.threshold && goals.salesValue.metinha.threshold > 0);
    if (teamGoalMet) {
        const teamBonus = goals.salesValue.performanceBonus?.prize || 0;
        totalPrize += teamBonus;
        teamBonusApplied = true;
    }

    const topScorer = allSellers.length > 0 ? allSellers.reduce((max, s) => (max.points + max.extraPoints) > (s.points + s.extraPoints) ? max : s) : null;
    if (topScorer && seller.id === topScorer.id) {
        topScorerBonus = goals.points.topScorerPrize || 0;
        totalPrize += topScorerBonus;
    }

    return { ...seller, prizes, totalPrize, teamBonusApplied, topScorerBonus };
};
