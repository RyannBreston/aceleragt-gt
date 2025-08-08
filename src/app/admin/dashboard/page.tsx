'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DollarSign, LayoutGrid, Star, Ticket, Box, Flag, LucideIcon } from "lucide-react";
import { useAdminContext } from '@/contexts/AdminContext';
import SalesOverviewChart from '@/components/SalesOverviewChart';
import type { Goals, Seller } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import AiInsights from '@/components/ai-insights';

// ####################################################################
// ### 1. COMPONENTE REUTILIZÁVEL: StatCard ###
// ####################################################################
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  Icon: LucideIcon;
  iconClassName?: string;
}

const StatCard = ({ title, value, description, Icon, iconClassName }: StatCardProps) => (
  <Card className="bg-card border-border shadow-lg rounded-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// ####################################################################
// ### 2. CUSTOM HOOK: useDashboardStats ###
// ####################################################################
const useDashboardStats = (sellers: Seller[]) => {
  return useMemo(() => {
    const totalSellers = sellers.length;
    if (totalSellers === 0) return { totalSellers: 0, currentSales: 0, totalPoints: 0, averageTicket: 0, averagePA: 0 };
    const currentSales = sellers.reduce((acc, seller) => acc + (seller.salesValue || 0), 0);
    const totalPoints = sellers.reduce((acc, seller) => acc + (seller.points || 0) + (seller.extraPoints || 0), 0);
    const totalTicket = sellers.reduce((acc, seller) => acc + (seller.ticketAverage || 0), 0);
    const totalPA = sellers.reduce((acc, seller) => acc + (seller.pa || 0), 0);
    return {
      totalSellers,
      currentSales,
      totalPoints,
      averageTicket: totalSellers > 0 ? totalTicket / totalSellers : 0,
      averagePA: totalSellers > 0 ? totalPA / totalSellers : 0,
    };
  }, [sellers]);
};

// --- Componente GoalDistribution ---
const GoalDistribution = ({ sellers, goals }: { sellers: Seller[], goals: Goals | null }) => {
  const goalTiers = ['lendaria', 'metona', 'meta', 'metinha'] as const;
  const goalLabels = { lendaria: 'Lendária', metona: 'Metona', meta: 'Meta', metinha: 'Metinha', nenhuma: 'Nenhuma' };

  const distribution = useMemo(() => {
    const criteria = ['salesValue', 'ticketAverage', 'pa', 'points'] as const;
    const result: Record<typeof criteria[number], Record<string, number>> = {
      salesValue: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      ticketAverage: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      pa: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      points: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
    };

    if (!goals) return result;

    sellers.forEach(seller => {
      criteria.forEach(criterion => {
        const sellerValue = criterion === 'points' ? (seller.points || 0) + (seller.extraPoints || 0) : (seller[criterion] || 0);
        let tierAchieved: keyof typeof goalLabels = 'nenhuma';
        
        for (const tier of goalTiers) {
          if (goals[criterion]?.[tier]?.threshold && sellerValue >= goals[criterion][tier].threshold && goals[criterion][tier].threshold > 0) {
            tierAchieved = tier;
            break; 
          }
        }
        result[criterion][tierAchieved]++;
      });
    });

    return result;
  }, [sellers, goals, goalTiers]); // CORREÇÃO: Adicionado 'goalTiers' às dependências

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flag className="text-primary"/><span>Distribuição de Metas</span></CardTitle>
        <CardDescription>Quantos vendedores atingiram cada nível de meta.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="salesValue">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
            <TabsTrigger value="salesValue">Vendas</TabsTrigger>
            <TabsTrigger value="ticketAverage">T. Médio</TabsTrigger>
            <TabsTrigger value="pa">PA</TabsTrigger>
            <TabsTrigger value="points">Pontos</TabsTrigger>
          </TabsList>
          {Object.keys(distribution).map((criterion) => (
            <TabsContent key={criterion} value={criterion} className="mt-4">
              <ul className="space-y-3">
                {Object.entries(goalLabels).map(([tierKey, tierLabel]) => (
                   <li key={tierKey} className="flex items-center justify-between text-sm">
                     <span className={cn("font-medium", tierKey === 'nenhuma' ? 'text-muted-foreground' : 'text-foreground')}>{tierLabel}</span>
                     <span className="font-bold text-primary">{distribution[criterion as keyof typeof distribution][tierKey]}</span>
                   </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}


// ####################################################################
// ### 3. DASHBOARD PAGE REATORIZADA ###
// ####################################################################
export default function DashboardPage() {
  const { sellers, goals } = useAdminContext();
  const { totalSellers, currentSales, totalPoints, averageTicket, averagePA } = useDashboardStats(sellers);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <LayoutGrid className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Vendas Totais (Mês)" value={currentSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} description="Total de vendas da equipa" Icon={DollarSign} />
        <StatCard title="Ticket Médio (Equipe)" value={averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} description="Média de ticket por venda" Icon={Ticket} />
        <StatCard title="PA Médio (Equipe)" value={averagePA.toFixed(2)} description="Média de produtos por atendimento" Icon={Box} />
        <StatCard title="Pontos Totais da Equipe" value={totalPoints.toLocaleString('pt-BR')} description="Soma de todos os pontos ganhos" Icon={Star} iconClassName="text-yellow-400" />
        <StatCard title="Vendedores Ativos" value={String(totalSellers)} description="Total de vendedores na equipe" Icon={Users} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesOverviewChart sellers={sellers} />
        </div>
        <div className="space-y-4">
            <GoalDistribution sellers={sellers} goals={goals} />
            <AiInsights sellers={sellers} />
        </div>
      </div>
    </div>
  );
}