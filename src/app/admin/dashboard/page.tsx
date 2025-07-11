'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Trophy, DollarSign, LayoutGrid, Star, Ticket, Box, Crown, Flag } from "lucide-react";
import { useAdminContext } from '@/app/admin/layout';
import SalesOverviewChart from '@/components/SalesOverviewChart';
import type { Goals, Seller } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';


const GoalDistribution = ({ sellers, goals }: { sellers: Seller[], goals: Goals }) => {
  const goalTiers = ['lendaria', 'metona', 'meta', 'metinha'] as const;
  const goalLabels = {
    lendaria: 'Lendária',
    metona: 'Metona',
    meta: 'Meta',
    metinha: 'Metinha',
    nenhuma: 'Nenhuma'
  };

  const distribution = useMemo(() => {
    const criteria = ['salesValue', 'ticketAverage', 'pa', 'points'] as const;
    const result: Record<typeof criteria[number], Record<string, number>> = {
      salesValue: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      ticketAverage: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      pa: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
      points: { nenhuma: 0, metinha: 0, meta: 0, metona: 0, lendaria: 0 },
    };

    sellers.forEach(seller => {
      criteria.forEach(criterion => {
        const sellerValue = criterion === 'points' ? seller.points + seller.extraPoints : seller[criterion];
        let tierAchieved: keyof typeof goalLabels = 'nenhuma';
        
        for (const tier of goalTiers) {
          if (sellerValue >= goals[criterion][tier].threshold && goals[criterion][tier].threshold > 0) {
            tierAchieved = tier;
            break; // Stop at the highest tier achieved
          }
        }
        result[criterion][tierAchieved]++;
      });
    });

    return result;
  }, [sellers, goals]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Flag className="text-primary"/>
            <span>Distribuição de Metas</span>
        </CardTitle>
        <CardDescription>
          Quantos vendedores atingiram cada nível de meta.
        </CardDescription>
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
                      <span className={cn(
                        "font-medium",
                        tierKey === 'nenhuma' ? 'text-muted-foreground' : 'text-foreground'
                      )}>{tierLabel}</span>
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


export default function DashboardPage() {
  const { sellers: sellersData, goals } = useAdminContext();

  const { 
    bestSellerByValue,
    bestSellerByTicket,
    bestSellerByPA,
    bestSellerByPoints,
    totalSellers,
    currentSales,
    totalPoints,
    averageTicket,
    averagePA,
  } = useMemo(() => {
    const totalSellers = sellersData.length;
    
    if (totalSellers === 0) {
      return {
        bestSellerByValue: { name: "Nenhum", salesValue: 0 },
        bestSellerByTicket: { name: "Nenhum", ticketAverage: 0 },
        bestSellerByPA: { name: "Nenhum", pa: 0 },
        bestSellerByPoints: { name: "Nenhum", points: 0, extraPoints: 0, totalPoints: 0 },
        totalSellers: 0,
        currentSales: 0,
        totalPoints: 0,
        averageTicket: 0,
        averagePA: 0,
      };
    }

    const currentSales = sellersData.reduce((acc, seller) => acc + seller.salesValue, 0);
    const totalPoints = sellersData.reduce((acc, seller) => acc + seller.points + seller.extraPoints, 0);
    const totalTicket = sellersData.reduce((acc, seller) => acc + seller.ticketAverage, 0);
    const totalPA = sellersData.reduce((acc, seller) => acc + seller.pa, 0);

    const sellersWithTotalPoints = sellersData.map(s => ({ ...s, totalPoints: s.points + s.extraPoints }));

    return { 
      bestSellerByValue: sellersData.reduce((prev, current) => (prev.salesValue > current.salesValue) ? prev : current),
      bestSellerByTicket: sellersData.reduce((prev, current) => (prev.ticketAverage > current.ticketAverage) ? prev : current),
      bestSellerByPA: sellersData.reduce((prev, current) => (prev.pa > current.pa) ? prev : current),
      bestSellerByPoints: sellersWithTotalPoints.reduce((prev, current) => (prev.totalPoints > current.totalPoints) ? prev : current),
      totalSellers,
      currentSales,
      totalPoints,
      averageTicket: totalSellers > 0 ? totalTicket / totalSellers : 0,
      averagePA: totalSellers > 0 ? totalPA / totalSellers : 0,
    };
  }, [sellersData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <LayoutGrid className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas Totais (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de vendas da equipe
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
             Ticket Médio (Equipe)
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
             Média de ticket por venda
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PA Médio (Equipe)
            </CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averagePA.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de produtos por atendimento
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais da Equipe</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPoints.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os pontos ganhos
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border col-span-1 md:col-span-2 lg:col-span-1 shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendedores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSellers}</div>
            <p className="text-xs text-muted-foreground">
              Total de vendedores na equipe
            </p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesOverviewChart sellers={sellersData} />
        </div>
        <GoalDistribution sellers={sellersData} goals={goals} />
      </div>
    </div>
  );
}
