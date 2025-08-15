'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Users, Check, Award } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/client-utils';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const DailySprintCard = () => {
    const { currentSeller, activeSprint } = useSellerContext();

    if (!activeSprint || !currentSeller) {
        return (
            <EmptyState 
                Icon={Zap}
                title="Nenhuma Corridinha Ativa"
                description="Não há nenhuma corridinha de vendas ativa para si no momento."
            />
        );
    }
    
    const sellerSales = currentSeller.salesValue || 0;
    
    const nextTier = activeSprint.sprintTiers.find(tier => sellerSales < tier.goal);
    const lastAchievedTier = [...activeSprint.sprintTiers].reverse().find(tier => sellerSales >= tier.goal);

    let progress = 0;
    let progressLabel = "Meta máxima atingida!";
    let description = `Parabéns! Você atingiu o último nível e garantiu um prémio de ${formatCurrency(lastAchievedTier?.prize || 0)}!`;

    if (nextTier) {
        const baseGoal = lastAchievedTier?.goal || 0;
        const range = nextTier.goal - baseGoal;
        progress = range > 0 ? ((sellerSales - baseGoal) / range) * 100 : 0;
        progressLabel = `Próximo Nível: ${formatCurrency(nextTier.goal)}`;
        description = `Venda mais ${formatCurrency(Math.max(0, nextTier.goal - sellerSales))} para ganhar +${formatCurrency(nextTier.prize)}!`;
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap /> {activeSprint.title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between font-semibold mb-2 text-muted-foreground text-sm">
                    <span>{progressLabel}</span>
                    <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2 mt-4">
                    {activeSprint.sprintTiers.map((tier, index) => (
                        <div key={index} className={cn(
                            'flex-1 text-center text-sm p-2 rounded-lg font-semibold transition-all',
                            sellerSales >= tier.goal ? 'bg-primary/20 text-primary-foreground' : 'bg-muted/50'
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


export default function SellerDashboardPage() {
    const { currentSeller, isAuthReady } = useSellerContext();

    if (!isAuthReady || !currentSeller) {
        return <DashboardSkeleton />;
    }

    const { name, prizes, totalPrize, rank } = currentSeller;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Bem-vindo, {name.split(' ')[0]}!</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Seu Resumo do Ciclo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Prémio Total Acumulado" value={formatCurrency(totalPrize)} icon={Award} />
                    <StatCard title="Sua Posição no Ranking" value={`${rank}º`} icon={Trophy} />
                    <StatCard title="Vendas (Prémio)" value={formatCurrency(prizes.salesValue)} icon={Users} />
                </CardContent>
            </Card>

            <DailySprintCard />
        </div>
    );
}
