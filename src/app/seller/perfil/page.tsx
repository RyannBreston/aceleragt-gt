'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { User } from 'lucide-react';

export default function PerfilPage() {
  return (
    <ComingSoon
      title="Perfil"
      description="Visualize e gerencie as informações do seu perfil de vendedor."
      icon={<User className="h-8 w-8 text-primary" />}
    />
  );
}
