'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Star, Ticket, Box, TrendingUp } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Goals, Seller } from '@/lib/types';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

type Metric = 'salesValue' | 'ticketAverage' | 'pa' | 'points';

// Função segura que calcula o progresso para uma meta individual.
const getGoalProgressDetails = (seller: Seller, goals: Goals, metric: Metric) => {
    const sellerValue = metric === 'points' ? (seller.points || 0) + (seller.extraPoints || 0) : seller[metric] || 0;

    const goalData = goals?.[metric];
    if (!goalData || !goalData.metinha?.threshold) {
        return { percent: 0, label: "Metas não definidas", details: "N/A" };
    }

    let nextGoal, currentGoalBase, nextGoalLabel;

    if (sellerValue >= goalData.lendaria.threshold) {
        return { percent: 100, label: `Nível Lendário Atingido!`, details: `${sellerValue.toLocaleString('pt-BR')}` };
    }
    if (sellerValue >= goalData.metona.threshold) {
        nextGoal = goalData.lendaria.threshold;
        currentGoalBase = goalData.metona.threshold;
        nextGoalLabel = 'Lendária';
    } else if (sellerValue >= goalData.meta.threshold) {
        nextGoal = goalData.metona.threshold;
        currentGoalBase = goalData.meta.threshold;
        nextGoalLabel = 'Metona';
    } else if (sellerValue >= goalData.metinha.threshold) {
        nextGoal = goalData.meta.threshold;
        currentGoalBase = goalData.metinha.threshold;
        nextGoalLabel = 'Meta';
    } else {
        nextGoal = goalData.metinha.threshold;
        currentGoalBase = 0;
        nextGoalLabel = 'Metinha';
    }

    const range = nextGoal - currentGoalBase;
    const progress = range > 0 ? ((sellerValue - currentGoalBase) / range) * 100 : 0;
    
    return {
        percent: Math.min(100, progress),
        label: `Próximo Nível: ${nextGoalLabel}`,
        details: `${sellerValue.toLocaleString('pt-BR')} / ${nextGoal.toLocaleString('pt-BR')}`
    };
};

// Sub-componente para os cartões de progresso de meta.
const GoalProgressCard = ({ title, Icon, seller, goals, metric }: { title: string; Icon: React.ElementType; seller: Seller; goals: Goals; metric: Metric }) => {
    const progress = getGoalProgressDetails(seller, goals, metric);
    const sellerValue = metric === 'points' ? (seller.points || 0) + (seller.extraPoints || 0) : seller[metric] || 0;
    
    const valueFormatter = (val: number) => {
        if (metric === 'pa') return val.toFixed(2);
        if (metric === 'points') return val.toLocaleString('pt-BR');
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{valueFormatter(sellerValue)}</div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="mt-2">
                                <p className="text-xs text-muted-foreground">{progress.label}</p>
                                <Progress value={progress.percent} className="h-2 mt-1" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{progress.details}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};

// --- Componente principal da página ---
export default function SellerDashboardPage() {
    const { currentSeller, goals, isAuthReady } = useSellerContext();

    if (!isAuthReady || !currentSeller) {
        return <DashboardSkeleton />;
    }

    // ✅ CORREÇÃO: A lógica foi movida para ANTES do return.
    const metrics: { title: string; Icon: React.ElementType; metric: Metric }[] = [
        { title: 'Meta de Vendas (Mês)', Icon: DollarSign, metric: 'salesValue' },
        { title: 'Meta de Ticket Médio', Icon: Ticket, metric: 'ticketAverage' },
        { title: 'Meta de PA', Icon: Box, metric: 'pa' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <TrendingUp className="size-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Meu Desempenho</h1>
                    <p className="text-muted-foreground">Bem-vindo(a) de volta, {currentSeller.name.split(' ')[0]}!</p>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map(m => (
                    <GoalProgressCard 
                        key={m.metric}
                        title={m.title}
                        Icon={m.Icon}
                        seller={currentSeller}
                        goals={goals}
                        metric={m.metric}
                    />
                ))}
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meus Pontos</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((currentSeller.points || 0) + (currentSeller.extraPoints || 0)).toLocaleString('pt-BR')}
                        </div>
                        <p className="text-xs text-muted-foreground">Total de pontos acumulados no ciclo.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}