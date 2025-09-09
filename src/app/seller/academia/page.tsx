'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { BookOpen } from 'lucide-react';

export default function AcademiaPage() {
  return (
    <ComingSoon
      title="Academia"
      description="Acesse cursos e treinamentos para aprimorar suas habilidades de vendas."
      icon={<BookOpen className="h-8 w-8 text-primary" />}
    />
  );
}
