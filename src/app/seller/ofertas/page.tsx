'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { Tag } from 'lucide-react';

export default function OfertasPage() {
  return (
    <ComingSoon
      title="Ofertas"
      description="Acesse as ofertas e promoções especiais para seus clientes."
      icon={<Tag className="h-8 w-8 text-primary" />}
    />
  );
}
