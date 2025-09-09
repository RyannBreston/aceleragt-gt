'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { CalendarClock } from 'lucide-react';

export default function EscalaPage() {
  return (
    <ComingSoon
      title="Escala"
      description="Visualize e gerencie a escala de trabalho dos vendedores."
      icon={<CalendarClock className="h-8 w-8 text-primary" />}
    />
  );
}
