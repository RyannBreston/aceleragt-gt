'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function SellerHistoricoPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <History /> Meu Histórico
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>
            Aqui será exibido o seu histórico de performance dos ciclos de vendas anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Esta funcionalidade será implementada na nova arquitetura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}