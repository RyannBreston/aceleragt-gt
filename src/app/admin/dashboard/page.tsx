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

  // Defensive check to ensure sellers is an array before using .reduce()
  const totalSalesValue = Array.isArray(sellers) ? sellers.reduce((acc, seller) => acc + (seller.sales_value || 0), 0) : 0;
  
  // Goals are already accessed safely with optional chaining.
  const monthlyGoal = goals?.data?.salesValue?.meta?.threshold || 0;
  const goalProgress = monthlyGoal > 0 ? (totalSalesValue / monthlyGoal) * 100 : 0;

  // Use a safer approach for other array-dependent parts too
  const sellerCount = Array.isArray(sellers) ? sellers.length : 0;
  const missionCount = Array.isArray(missions) ? missions.length : 0;
  const sprintCount = Array.isArray(sprints) ? sprints.length : 0;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{sellerCount}</div>
            <p className="text-xs text-muted-foreground">Vendedores ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missões Disponíveis</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionCount}</div>
            <p className="text-xs text-muted-foreground">Missões ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridinhas Criadas</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprintCount}</div>
            <p className="text-xs text-muted-foreground">Sprints disponíveis</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Visão Geral de Vendas</CardTitle></CardHeader>
          {/* Pass an empty array as fallback to child components */}
          <CardContent><SalesOverviewChart sellers={sellers || []} /></CardContent>
        </Card>
        <Card>
           <CardHeader><CardTitle>Ranking de Vendedores</CardTitle></CardHeader>
          {/* Pass an empty array as fallback to child components */}
          <CardContent><SalesTable sellers={sellers || []} /></CardContent>
        </Card>
      </div>
    </div>
  );
}