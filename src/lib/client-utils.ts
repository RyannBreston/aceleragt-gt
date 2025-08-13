import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SellerWithPrizes, MetricGoals, GoalLevel } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PrizeMetric = 'salesValue' | 'ticketAverage' | 'pa' | 'points';

/**
 * Calcula os prémios de um vendedor com base nas metas definidas.
 * A lógica é executada em duas passagens para garantir a precisão dos pontos:
 * 1.  **Passagem de Pontos**: Primeiro, calcula-se apenas os bónus em pontos ganhos.
 *     Isso é crucial porque os pontos ganhos ao atingir uma "Metinha" devem contar para alcançar a "Meta", e assim por diante.
 * 2.  **Passagem de Prémios**: Com o total de pontos atualizado (base + bónus), a função calcula os prémios
 *     monetários para todas as métricas (Vendas, Ticket Médio, PA e o total de Pontos consolidado).
 */
export const calculateSellerPrizes = (
  sellerData: Seller,
  sellers: Seller[], // Necessário para calcular o ranking geral e bónus de equipa
  goals: Goals
): SellerWithPrizes => {

  const initialPrizes: Record<PrizeMetric, number> = {
    salesValue: 0,
    ticketAverage: 0,
    pa: 0,
    points: 0,
  };

  // --- PASSAGEM 1: Calcular Bónus em Pontos ---
  const pointGoals = goals.points;
  let bonusPointsFromGoals = 0;
  if (pointGoals) {
    const levels: (keyof MetricGoals)[] = ['lendaria', 'metona', 'meta', 'metinha'];
    // Usa os pontos base (lançados) para determinar o bónus em pontos.
    const basePoints = (sellerData.points || 0) + (sellerData.extraPoints || 0);
    for (const level of levels) {
      const goalLevel = pointGoals[level] as GoalLevel;
      // Verifica se a meta de pontos foi atingida e se há um bónus de pontos configurado
      if (goalLevel && goalLevel.threshold > 0 && basePoints >= goalLevel.threshold && goalLevel.points) {
        bonusPointsFromGoals = goalLevel.points;
        break; // Para no primeiro nível mais alto atingido que concede pontos
      }
    }
  }

  // O total de pontos é a soma dos pontos base, extras e os bónus ganhos por atingir metas.
  const totalPoints = (sellerData.points || 0) + (sellerData.extraPoints || 0) + bonusPointsFromGoals;

  // --- PASSAGEM 2: Calcular Prémios Monetários ---
  const finalPrizes = { ...initialPrizes };
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
        finalPrizes[metric] = goalLevel.prize || 0;
        break; // Para no prémio do nível mais alto atingido
      }
    }
  });

  const totalPrizeFromMetrics = Object.values(finalPrizes).reduce((sum, prize) => sum + prize, 0);

  // Lógica de ranking (simplificada, pode ser expandida)
  const rankedSellers = [...sellers].sort((a, b) => b.salesValue - a.salesValue);
  const rank = rankedSellers.findIndex((s) => s.id === sellerData.id) + 1;

  // Atualiza os pontos do vendedor com os bónus calculados para retornar o valor final
  const finalSellerData = {
      ...sellerData,
      // AVISO: A variável 'points' no objeto Seller é modificada aqui para refletir o bónus.
      // Isso é para exibição e cálculo, mas o valor no banco de dados permanece o original.
      points: totalPoints, 
  };

  return {
    ...finalSellerData,
    prizes: finalPrizes,
    totalPrize: totalPrizeFromMetrics,
    rank,
    teamBonusApplied: false, // Lógica de bónus de equipa pode ser implementada aqui
    topScorerBonus: 0,      // Lógica de prémio para melhor pontuador pode ser implementada aqui
  };
};
