'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Loader2 } from 'lucide-react';

export default function EscalaPage() {
  const { isLoading } = useSellerContext();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar /> Minha Escala de Trabalho
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            A funcionalidade para visualizar a sua escala de trabalho será implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}