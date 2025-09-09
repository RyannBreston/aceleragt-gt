'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { Store } from 'lucide-react';

export default function LojaPage() {
  return (
    <ComingSoon
      title="Loja"
      description="Gerencie os produtos e prêmios disponíveis na loja para os vendedores."
      icon={<Store className="h-8 w-8 text-primary" />}
    />
  );
}
