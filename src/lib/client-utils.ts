import type { Seller, Goals, SellerWithPrizes, PrizeDetail, MetricGoals } from './types';

/**
 * Calcula os prémios totais para um único vendedor com base nas metas e performance.
 * Esta função está agora completamente desacoplada do Firebase.
 */
export function calculateSellerPrizes(
  seller: Seller,
  _allSellers: Seller[],
  goals: Goals
): SellerWithPrizes {
  
  const prizeDetails: PrizeDetail[] = [];
  const goalData = goals.data; // A estrutura complexa está dentro de 'data'

  if (goalData) {
    const metrics: (keyof typeof goalData)[] = ['salesValue', 'ticketAverage', 'pa', 'points'];
    
    metrics.forEach(metric => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sellerValue = (seller as any)[metric] || 0;
      const metricGoals = goalData[metric as keyof typeof goalData] as MetricGoals | undefined;

      if (metricGoals) {
        // Lógica de prémios por nível (Metinha, Meta, etc.)
        const levels: (keyof MetricGoals)[] = ['metinha', 'meta', 'metona', 'lendaria'];
        levels.forEach(level => {
          const goalLevel = metricGoals[level];
          if (goalLevel?.threshold && goalLevel.prize && sellerValue >= goalLevel.threshold) {
            prizeDetails.push({
              reason: `Atingiu ${level} de ${metric}`,
              amount: goalLevel.prize,
              level: level,
            });
          }
        });

        // Lógica de bónus de performance
        const perfBonus = metricGoals.performanceBonus;
        if (perfBonus?.per && perfBonus.prize && perfBonus.per > 0) {
            const bonusAmount = Math.floor(sellerValue / perfBonus.per) * perfBonus.prize;
            if (bonusAmount > 0) {
                prizeDetails.push({ reason: `Bónus de performance em ${metric}`, amount: bonusAmount });
            }
        }
      }
    });
  }

  // A lógica do sprint e outros prémios pode ser adicionada aqui...

  const totalPrize = prizeDetails.reduce((sum, prize) => sum + prize.amount, 0);

  return {
    ...seller,
    prizes: {
      total: totalPrize,
      details: prizeDetails,
    },
  };
}