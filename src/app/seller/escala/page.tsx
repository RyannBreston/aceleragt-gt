'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { CalendarClock } from 'lucide-react';

export default function EscalaPage() {
  return (
    <ComingSoon
      title="Escala"
      description="Visualize sua escala de trabalho e os próximos plantões."
      icon={<CalendarClock className="h-8 w-8 text-primary" />}
    />
  );
}
