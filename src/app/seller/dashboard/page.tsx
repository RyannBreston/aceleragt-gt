/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import type { Seller } from '@/lib/types';
import { SellerProvider, useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Loader2, DollarSign, Gem, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function SellerDashboardContent() {
  const { currentSeller, goals, isLoading } = useSellerContext();
  const [ranking, setRanking] = useState<Seller[]>([]);
  const [position, setPosition] = useState<number | null>(null);

  // Early return for loading or no seller
  if (isLoading || !currentSeller) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  // TypeScript now knows currentSeller is not null
  const seller = currentSeller;

  useEffect(() => {
    async function fetchRanking() {
      const res = await fetch('/api/sellers');
      const all: Seller[] = await res.json();
      const sorted = all.sort((a, b) => (b.points || 0) - (a.points || 0));
      setRanking(sorted);
      const idx = sorted.findIndex(s => s.id === seller.id);
      setPosition(idx >= 0 ? idx + 1 : null);
    }
    fetchRanking();
  }, [seller]);

  const { name, sales_value = 0, points = 0, pa = 0, ticket_average = 0 } = seller;
  const monthlyGoal = goals?.monthly_goal || 0;
  const goalProgress = monthlyGoal > 0 ? (sales_value / monthlyGoal) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {position !== null && (
        <Card>
          <CardHeader><CardTitle>Sua Posição no Ranking</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg">
              Você está em <span className="font-semibold">{position}º</span> lugar
            </div>
          </CardContent>
        </Card>
      )}

      {position !== null && (
        <Card>
          <CardHeader><CardTitle>Vizinhos no Ranking</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.slice(Math.max(0, (position-1)-2), (position-1)+3).map((s, i) => (
                  <TableRow key={s.id} className={s.id===seller.id ? 'bg-muted' : ''}>
                    <TableCell>{Math.max(0, (position-1)-2) + i + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-right">{s.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <h1 className="text-2xl font-bold">Olá, {name.split(' ')[0]}!</h1>

      <Card>
        <CardHeader>
          <CardTitle>Progresso da Meta Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-primary">{formatCurrency(sales_value)}</span>
            <span className="text-sm text-muted-foreground">de {formatCurrency(monthlyGoal)}</span>
          </div>
          <Progress value={goalProgress} className="w-full" />
          <p className="text-xs text-muted-foreground mt-2">{goalProgress.toFixed(1)}% da sua meta alcançada.</p>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seus Pontos</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{points}</div>
            <p className="text-xs text-muted-foreground">Pontos para trocar na loja</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticket_average)}</div>
            <p className="text-xs text-muted-foreground">Valor médio por venda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PA (Peças por Atendimento)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Média de itens por cliente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// O provider envolve o conteúdo para garantir o acesso ao contexto
export default function SellerDashboardPage() {
    return (
        <SellerProvider>
            <SellerDashboardContent />
        </SellerProvider>
    )
}