'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem } from 'lucide-react';

export default function SellerLojaPage() {
  // A lógica para buscar e exibir produtos viria de uma nova API
  // e seria gerida pelo SellerContext.

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gem /> Loja de Prémios
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            A funcionalidade da loja de prémios, onde você poderá trocar os seus pontos, será implementada aqui na nova arquitetura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}