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

/**
 * ✅ FUNÇÃO CORRIGIDA: getGoalProgressDetails
 * Adicionámos verificações de segurança (usando '?.') para garantir que o código não quebra
 * se os dados de 'goals' ainda não estiverem disponíveis.
 */
const getGoalProgressDetails = (seller: Seller, goals: Goals, metric: Metric) => {
    const sellerValue = metric === 'points' ? (seller.points || 0) + (seller.extraPoints || 0) : seller[metric] || 0;

    // A utilização de '?.' (Optional Chaining) previne o erro.
    // Se 'goals[metric]' ou qualquer nível de meta for undefined, a verificação falha graciosamente.
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


// Sub-componente para os cartões de métrica
const MetricCard = ({ title, value, Icon, seller, goals, metric }: { title: string; value: string; Icon: React.ElementType; seller: Seller; goals: Goals; metric: Metric }) => {
    const progress = getGoalProgressDetails(seller, goals, metric);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
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


export default function SellerDashboardPage() {
    const { currentSeller, goals, isAuthReady } = useSellerContext();

    // Enquanto os dados essenciais (autenticação e vendedor) não estiverem prontos, mostre o skeleton.
    if (!isAuthReady || !currentSeller) {
        return <DashboardSkeleton />;
    }

    const metrics: { title: string; value: string; Icon: React.ElementType; metric: Metric }[] = [
        {
            title: 'Minhas Vendas (Mês)',
            value: (currentSeller.salesValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            Icon: DollarSign,
            metric: 'salesValue'
        },
        {
            title: 'Meu Ticket Médio',
            value: (currentSeller.ticketAverage || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            Icon: Ticket,
            metric: 'ticketAverage'
        },
        {
            title: 'Meu PA',
            value: (currentSeller.pa || 0).toFixed(2),
            Icon: Box,
            metric: 'pa'
        },
        {
            title: 'Meus Pontos',
            value: ((currentSeller.points || 0) + (currentSeller.extraPoints || 0)).toLocaleString('pt-BR'),
            Icon: Star,
            metric: 'points'
        },
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
                    <MetricCard 
                        key={m.metric}
                        title={m.title}
                        value={m.value}
                        Icon={m.Icon}
                        seller={currentSeller}
                        // Passa o objeto 'goals' para o MetricCard. A verificação de segurança é feita lá dentro.
                        goals={goals}
                        metric={m.metric}
                    />
                ))}
            </div>

            {/* Aqui você pode adicionar outros componentes, como gráficos de desempenho, etc. */}
        </div>
    );
}