'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { BarChart } from 'lucide-react';

export default function RankingPage() {
  return (
    <ComingSoon
      title="Ranking"
      description="Acompanhe seu desempenho e sua posição no ranking de vendedores."
      icon={<BarChart className="h-8 w-8 text-primary" />}
    />
  );
}
