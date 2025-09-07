'use client';

import React from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, History } from 'lucide-react';

export default function AdminHistoricoPage() {
  // A lógica para `cycleHistory` precisa ser implementada no AdminContext e na API.
  const { isLoading } = useAdminContext(); 
  
  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <History /> Histórico de Ciclos
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>
            Aqui será exibido o histórico de performance dos ciclos de vendas anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Esta funcionalidade será implementada na nova arquitetura, buscando os dados da tabela de histórico no Neon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}