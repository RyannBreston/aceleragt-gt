'use client';

import React from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Target, Rocket, Banknote } from 'lucide-react';
import SalesOverviewChart from '@/components/SalesOverviewChart';
import SalesTable from '@/components/sales-table';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function AdminDashboardPage() {
  const { sellers, missions, sprints, goals, isLoading } = useAdminContext();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const totalSalesValue = sellers.reduce((acc, seller) => acc + (seller.sales_value || 0), 0);
  const monthlyGoal = goals?.data?.salesValue?.meta?.threshold || 0;
  const goalProgress = monthlyGoal > 0 ? (totalSalesValue / monthlyGoal) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais (Mês)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalesValue)}</div>
            <p className="text-xs text-muted-foreground">de {formatCurrency(monthlyGoal)}</p>
            <Progress value={goalProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
            <p className="text-xs text-muted-foreground">Vendedores ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missões Disponíveis</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missions.length}</div>
            <p className="text-xs text-muted-foreground">Missões ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridinhas Criadas</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprints.length}</div>
            <p className="text-xs text-muted-foreground">Sprints disponíveis</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Visão Geral de Vendas</CardTitle></CardHeader>
          <CardContent><SalesOverviewChart sellers={sellers} /></CardContent>
        </Card>
        <Card>
           <CardHeader><CardTitle>Ranking de Vendedores</CardTitle></CardHeader>
          <CardContent><SalesTable sellers={sellers} /></CardContent>
        </Card>
      </div>
    </div>
  );
}