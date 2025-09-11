'use client';

import React from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Target, Rocket, Banknote, ShoppingCart, TrendingUp } from 'lucide-react';
import SalesOverviewChart from '@/components/SalesOverviewChart';
import SalesTable from '@/components/sales-table';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/StatCard';

export default function AdminDashboardPage() {
  const { sellers, missions, sprints, goals, isLoading } = useAdminContext();

  if (isLoading || !sellers || !missions || !sprints) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const totalSalesValue = sellers.reduce((acc, seller) => acc + (seller.sales_value || 0), 0);
  const totalPa = sellers.reduce((acc, seller) => acc + (seller.pa || 0), 0);
  const averageTicket = sellers.length > 0 
    ? sellers.reduce((acc, seller) => acc + (seller.ticket_average || 0), 0) / sellers.length
    : 0;
  
  const monthlyGoal = goals?.data?.salesValue?.meta?.threshold || 0;
  const goalProgress = monthlyGoal > 0 ? (totalSalesValue / monthlyGoal) * 100 : 0;
  const sellerCount = sellers.length;
  const missionCount = missions.length;
  const sprintCount = sprints.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas Totais (Mês)"
          value={formatCurrency(totalSalesValue)}
          icon={Banknote}
          footer={
            <>
              Meta: {formatCurrency(monthlyGoal)} ({goalProgress.toFixed(0)}%)
            </>
          }
          progress={goalProgress}
        />
        <StatCard
          title="Ticket Médio Geral"
          value={formatCurrency(averageTicket)}
          icon={TrendingUp}
          footer="Média de todos os vendedores"
        />
        <StatCard
          title="PA Total (Peças por Atendimento)"
          value={totalPa.toFixed(2)}
          icon={ShoppingCart}
          footer="Soma de todas as peças vendidas"
        />
        <StatCard
          title="Total de Vendedores"
          value={sellerCount}
          icon={Users}
          footer="Vendedores ativos na plataforma"
        />
        <StatCard
          title="Missões Disponíveis"
          value={missionCount}
          icon={Target}
          footer="Missões ativas para os vendedores"
        />
        <StatCard
          title="Corridinhas Criadas"
          value={sprintCount}
          icon={Rocket}
          footer="Sprints disponíveis no período"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Visão Geral de Vendas</CardTitle></CardHeader>
          <CardContent><SalesOverviewChart sellers={sellers} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader><CardTitle>Ranking de Vendedores</CardTitle></CardHeader>
          <CardContent><SalesTable sellers={sellers} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
