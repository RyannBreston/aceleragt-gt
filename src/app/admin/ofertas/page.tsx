'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { Tag } from 'lucide-react';

export default function OfertasPage() {
  return (
    <ComingSoon
      title="Ofertas"
      description="Crie e gerencie as ofertas disponíveis para a equipe de vendas."
      icon={<Tag className="h-8 w-8 text-primary" />}
    />
  );
}
