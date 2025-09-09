'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { BarChart } from 'lucide-react';

export default function RankingPage() {
  return (
    <ComingSoon
      title="Ranking"
      description="Acompanhe o desempenho dos vendedores e as classificações gerais."
      icon={<BarChart className="h-8 w-8 text-primary" />}
    />
  );
}
