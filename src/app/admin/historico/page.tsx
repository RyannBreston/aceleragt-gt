'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { History } from 'lucide-react';

export default function HistoricoPage() {
  return (
    <ComingSoon
      title="Histórico"
      description="Acesse o histórico de atividades, vendas e metas."
      icon={<History className="h-8 w-8 text-primary" />}
    />
  );
}
