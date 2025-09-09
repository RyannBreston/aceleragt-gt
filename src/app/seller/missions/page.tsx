'use client';

import React from 'react';
import ComingSoon from '@/components/ComingSoon';
import { CheckCheck } from 'lucide-react';

export default function MissionsPage() {
  return (
    <ComingSoon
      title="Missões"
      description="Visualize e participe de missões para ganhar recompensas."
      icon={<CheckCheck className="h-8 w-8 text-primary" />}
    />
  );
}
