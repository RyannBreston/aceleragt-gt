'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';

export default function EscalaPage() {
  const { isLoading } = useAdminContext();

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
        <Calendar /> Gestão de Escala de Trabalho
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>
            Aqui será implementada a funcionalidade para criar e gerir as escalas de trabalho dos vendedores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            A lógica para esta página será construída utilizando a nova arquitetura com Neon e NextAuth.js.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}