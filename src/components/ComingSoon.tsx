'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Card className="border-dashed">
        <CardHeader className="flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <CardTitle>Em Breve!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
