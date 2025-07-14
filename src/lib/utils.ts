import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SalesValueGoals } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateSellerPrizes = (
    seller: Seller,
    allSellers: Seller[],
    goals: Goals
) => {
    const prizes: Record<keyof Omit<Goals, 'salesValue' | 'gamification'>, number> = {
        salesValue: 0,
        ticketAverage: 0,
        pa: 0,
        points: 0,
    };
    const zeroedPrizes = {...prizes};

    // --- CORREÇÃO ADICIONADA AQUI ---
    // Verifica se os dados das metas foram carregados antes de continuar.
    if (!goals || !goals.points) {
        console.warn("Cálculo de prémios ignorado: objeto de metas (goals) ainda não está disponível.");
        return { ...seller, prizes: zeroedPrizes, totalPrize: 0, teamBonusApplied: false, topScorerBonus: 0 };
    }
    // --- FIM DA CORREÇÃO ---

    // Regra: Tem de atingir a "metinha" de pontos para ser elegível a qualquer prémio
    if ((seller.points + seller.extraPoints) < goals.points.metinha.threshold) {
        return { ...seller, prizes: zeroedPrizes, totalPrize: 0, teamBonusApplied: false, topScorerBonus: 0 };
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

    let totalPrize = Object.values(prizes).reduce((sum, p) => sum + p, 0);
    
    let teamBonusApplied = false;
    let topScorerBonus = 0;
    const teamBonusAmount = 100;

    const teamGoalMet = allSellers.length > 1 && allSellers.every(s => s.salesValue >= goals.salesValue.metinha.threshold && goals.salesValue.metinha.threshold > 0);
    if (teamGoalMet) {
        totalPrize += teamBonusAmount;
        teamBonusApplied = true;
    }

    const topScorer = allSellers.length > 0 ? allSellers.reduce((max, s) => (max.points + max.extraPoints) > (s.points + s.extraPoints) ? max : s) : null;
    if (topScorer && seller.id === topScorer.id) {
        topScorerBonus = goals.points.topScorerPrize || 0;
        totalPrize += topScorerBonus;
    }

    return { ...seller, prizes, totalPrize, teamBonusApplied, topScorerBonus };
};