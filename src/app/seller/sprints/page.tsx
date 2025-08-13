'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Check, Award } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { DailySprint, Seller, Goals, GoalLevel, MetricGoals } from '@/lib/types';
import { cn } from '@/lib/client-utils';
import { EmptyState } from '@/components/EmptyState';

// --- Componente: Card de Prémios da Corridinha ---
const SprintPrizesCard = ({ seller, goals }: { seller: Seller, goals: Goals | null }) => {
    const extraPoints = seller.extraPoints || 0;

    const prizeFromPoints = useMemo(() => {
        if (!goals || !goals.points) return 0;

        const pointGoals = goals.points as MetricGoals;
        const totalPoints = (seller.points || 0) + extraPoints;
        const levels: (keyof MetricGoals)[] = ['lendaria', 'metona', 'meta', 'metinha'];
        
        for (const level of levels) {
            const goalLevel = pointGoals[level] as GoalLevel;
            if (goalLevel && goalLevel.threshold > 0 && totalPoints >= goalLevel.threshold) {
                return goalLevel.prize || 0;
            }
        }
        return 0;
    }, [seller, extraPoints, goals]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award /> Prémios das Corridinhas</CardTitle>
                <CardDescription>O seu acumulado de prémios ganhos através das corridinhas diárias neste ciclo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Pontos Extras Ganhos</h3>
                    <p className="text-3xl font-bold text-primary">{extraPoints.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Impacto no Prémio de Pontos</h3>
                    <p className="text-3xl font-bold text-green-400">{prizeFromPoints.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className="text-xs text-muted-foreground mt-1">Este valor representa o seu prémio total na categoria de Pontos (metas + corridinhas).</p>
                </div>
            </CardContent>
        </Card>
    );
};

// --- Componente: Card da Corridinha Ativa ---
const DailySprintCard = ({ sprint, seller }: { sprint: DailySprint; seller: Seller }) => {
    const sellerSales = seller.salesValue || 0;
    
    const nextTier = sprint.sprintTiers.find(tier => sellerSales < tier.goal);
    const lastAchievedTier = [...sprint.sprintTiers].reverse().find(tier => sellerSales >= tier.goal);

    let progress = 0;
    let progressLabel = "Meta máxima atingida!";
    let description = `Parabéns! Você ganhou ${lastAchievedTier?.points || 0} pontos extras por atingir o último nível!`;

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

// --- Página Principal ---
export default function SellerSprintPage() {
    const { currentSeller, activeSprint, goals, isAuthReady } = useSellerContext();

    if (!isAuthReady || !currentSeller) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Zap className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Corridinha Diária</h1>
            </div>

            <SprintPrizesCard seller={currentSeller} goals={goals} />

            {activeSprint ? (
                <DailySprintCard sprint={activeSprint} seller={currentSeller} />
            ) : (
                <EmptyState 
                    Icon={Zap}
                    title="Nenhuma Corridinha Ativa"
                    description="Não há nenhuma corridinha de vendas ativa para si no momento. Fique atento para o próximo desafio!"
                />
            )}
        </div>
    );
}
