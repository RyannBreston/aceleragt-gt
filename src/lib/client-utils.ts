import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Seller, Goals, SellerWithPrizes } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateSellerPrizes = (
  sellerData: Seller,
  sellers: Seller[],
  goals: Goals
): SellerWithPrizes => {
  const rankedSellers = [...sellers].sort((a, b) => b.salesValue - a.salesValue);
  const rank = rankedSellers.findIndex((s) => s.id === sellerData.id) + 1;

  const prizes = {
    sprintPrize: 0,
    monthPrize: 0,
  };

  if (goals) {
    // These properties do not exist on the Goals type.
    // if (rank === 1 && sellerData.salesValue >= goals.sprintGoal) {
    //   prizes.sprintPrize = goals.sprintPrize;
    // }
    // if (rank === 1 && sellerData.salesValue >= goals.monthGoal) {
    //   prizes.monthPrize = goals.monthPrize;
    // }
  }

  return {
    ...sellerData,
    prizes,
    rank,
  };
};
