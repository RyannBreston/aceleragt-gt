'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, Ticket, Box, TrendingUp, Zap, Check, UserPlus, Loader2 } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Goals, Seller, DailySprint } from '@/lib/types';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { cn } from '@/lib/utils';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type Metric = 'ticketAverage' | 'pa';

const getGoalProgressDetails = (seller: Seller, goals: Goals, metric: Metric) => {
    const sellerValue = seller[metric] || 0;
    const goalData = goals?.[metric];
    if (!goalData || !goalData.metinha?.threshold) {
        return { percent: 0, label: "Meta não definida", details: "N/A" };
    }
    let nextGoal, currentGoalBase, nextGoalLabel;
    if (sellerValue >= goalData.lendaria.threshold) { return { percent: 100, label: `Nível Lendário Atingido!`, details: `${sellerValue.toLocaleString('pt-BR')}` }; }
    if (sellerValue >= goalData.metona.threshold) { nextGoal = goalData.lendaria.threshold; currentGoalBase = goalData.metona.threshold; nextGoalLabel = 'Lendária'; }
    else if (sellerValue >= goalData.meta.threshold) { nextGoal = goalData.metona.threshold; currentGoalBase = goalData.meta.threshold; nextGoalLabel = 'Metona'; }
    else if (sellerValue >= goalData.metinha.threshold) { nextGoal = goalData.meta.threshold; currentGoalBase = goalData.metinha.threshold; nextGoalLabel = 'Meta'; }
    else { nextGoal = goalData.metinha.threshold; currentGoalBase = 0; nextGoalLabel = 'Metinha'; }
    const range = nextGoal - currentGoalBase;
    const progress = range > 0 ? ((sellerValue - currentGoalBase) / range) * 100 : 0;
    
    const valueFormatter = (val: number) => {
        if (metric === 'pa') return val.toFixed(2);
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return {
        percent: Math.min(100, progress),
        label: `Próximo Nível: ${nextGoalLabel}`,
        details: `${valueFormatter(sellerValue)} / ${valueFormatter(nextGoal)}`
    };
};

const GoalProgressCard = ({ title, Icon, seller, goals, metric }: { title: string; Icon: React.ElementType; seller: Seller; goals: Goals; metric: Metric }) => {
    const progress = getGoalProgressDetails(seller, goals, metric);
    const sellerValue = seller[metric] || 0;
    
    const valueFormatter = (val: number) => {
        if (metric === 'pa') return val.toFixed(2);
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
                        <TooltipContent><p>{progress.details}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};

const DailySprintCard = ({ sprint, seller }: { sprint: DailySprint; seller: Seller }) => {
    const sellerSales = seller.salesValue || 0;
    
    const nextTier = sprint.sprintTiers.find(tier => sellerSales < tier.goal);
    const lastAchievedTier = [...sprint.sprintTiers].reverse().find(tier => sellerSales >= tier.goal);

    let progress = 0;
    let progressLabel = "Meta máxima atingida!";
    let description = `Parabéns! Você ganhou ${lastAchievedTier?.points || 0} pontos extras!`;

    if (nextTier) {
        const baseGoal = lastAchievedTier?.goal || 0;
        const range = nextTier.goal - baseGoal;
        progress = range > 0 ? ((sellerSales - baseGoal) / range) * 100 : 0;
        progressLabel = `Próximo Nível: ${nextTier.goal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
        description = `Venda mais ${Math.max(0, nextTier.goal - sellerSales).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} para ganhar +${nextTier.points} pts!`;
    }

    return (
        <Card className="col-span-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl"><Zap /> {sprint.title}</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between font-semibold mb-2 text-primary-foreground/90">
                    <span>{progressLabel}</span>
                    <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-4 [&>div]:bg-white" />
                <div className="flex gap-2 mt-4">
                    {sprint.sprintTiers.map((tier, index) => (
                        <div key={index} className={cn(
                            'flex-1 text-center text-sm p-2 rounded-lg font-semibold transition-all',
                            sellerSales >= tier.goal ? 'bg-white/30' : 'bg-black/20 opacity-70'
                        )}>
                            {sellerSales >= tier.goal && <Check className="inline size-5 mr-1.5"/>}
                            Nível {index + 1}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const AttendanceCard = ({ seller }: { seller: Seller }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const attendanceCount = seller.dailyAttendanceCount || 0;

    const handleIncrement = async () => {
        setIsSubmitting(true);
        try {
            const incrementFunction = httpsCallable(functions, 'incrementAttendance');
            await incrementFunction();
            toast({ title: "Atendimento Registado!", description: "O seu contador de atendimentos foi atualizado." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Atendimentos do Dia</CardTitle>
                <CardDescription className="text-xs">Clientes que atendeu hoje.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="text-3xl font-bold">{attendanceCount}</div>
                <Button onClick={handleIncrement} disabled={isSubmitting} size="lg">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
                </Button>
            </CardContent>
        </Card>
    );
};


export default function SellerDashboardPage() {
    const { currentSeller, goals, isAuthReady, activeSprint } = useSellerContext();

    if (!isAuthReady || !currentSeller || !goals) {
        return <DashboardSkeleton />;
    }

    const metrics: { title: string; Icon: React.ElementType; metric: Metric }[] = [
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
                <AttendanceCard seller={currentSeller} />

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

            {activeSprint && <DailySprintCard sprint={activeSprint} seller={currentSeller} />}
        </div>
    );
}
