'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { Store } from 'lucide-react';

export default function LojaPage() {
  return (
    <ComingSoon
      title="Loja"
      description="Navegue pelos produtos e prêmios disponíveis para resgate."
      icon={<Store className="h-8 w-8 text-primary" />}
    />
  );
}
