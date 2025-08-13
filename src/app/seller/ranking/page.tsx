/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  DollarSign,
  Ticket,
  Box,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext';
import type { Goals, Seller, MetricGoals } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, calculateSellerPrizes } from '@/lib/client-utils';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// ####################################################################
// ### 1. TIPOS E CONSTANTES ###
// ####################################################################

type RankingCriterion = 'totalPrize' | 'salesValue' | 'ticketAverage' | 'pa' | 'points';
type GoalLevelName = 'Metinha' | 'Meta' | 'Metona' | 'Lendária';
type SellerWithPrize = ReturnType<typeof calculateSellerPrizes>;

const TABS_CONFIG: { value: RankingCriterion; label: string; icon: React.ElementType }[] = [
    { value: 'totalPrize', label: 'Prémio Total', icon: Trophy },
    { value: 'salesValue', label: 'Vendas', icon: DollarSign },
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'ticketAverage', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
];

const goalLevelConfig: Record<GoalLevelName, { label: string; className: string; }> = {
    'Metinha': { label: 'Metinha', className: 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' },
    'Meta': { label: 'Meta', className: 'border-green-500/50 text-green-500 bg-green-500/10' },
    'Metona': { label: 'Metona', className: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
    'Lendária': { label: 'Lendária', className: 'border-purple-500/50 text-purple-400 bg-purple-500/10' },
};

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ####################################################################
// ### 2. HOOK DE LÓGICA DE DADOS ###
// ####################################################################

const useSellerPerformance = (criterion: RankingCriterion) => {
    const { sellers, goals, currentSeller } = useSellerContext();

    const sellersWithPrizes = useMemo(() => {
        if (!goals || !currentSeller) return [];
        // Apenas o vendedor atual precisa ser processado para esta página
        return [calculateSellerPrizes(currentSeller, sellers, goals)];
    }, [currentSeller, sellers, goals]);

    const sellerData = useMemo(() => {
         if (!currentSeller) return null;
        // Recalcula prémios para o vendedor atual para ter os dados mais recentes
        const data = goals ? calculateSellerPrizes(currentSeller, sellers, goals) : null;
        return data;
    }, [currentSeller, sellers, goals]);


    const sortedSellersForRank = useMemo(() => {
        if(!goals) return [];
        return sellers.map(s => calculateSellerPrizes(s, sellers, goals)).sort((a, b) => {
            if (criterion === 'totalPrize') return b.totalPrize - a.totalPrize;
            if (criterion === 'points') return (b.points + b.extraPoints) - (a.points + a.extraPoints);
            const valueA = (a as any)[criterion as keyof Seller] || 0;
            const valueB = (b as any)[criterion as keyof Seller] || 0;
            return valueB - valueA;
        });
    }, [sellers, goals, criterion]);
    
    const currentUserRank = useMemo(() => {
        if (!sellerData) return -1;
        return sortedSellersForRank.findIndex(s => s.id === sellerData.id);
    }, [sortedSellersForRank, sellerData]);

    const goalProgress = useMemo(() => {
        if (!sellerData || !goals || criterion === 'totalPrize') {
            return { percent: 0, label: '', achievedLevels: [] };
        }
        const metric = criterion as keyof Omit<Goals, 'gamification' | 'teamGoalBonus'>;
        
        const goalData = goals[metric];
        if (typeof goalData !== 'object' || goalData === null) {
            return { percent: 0, label: 'Metas não definidas', achievedLevels: [] };
        }

        const sellerValue = sellerData.points; // `points` já inclui `extraPoints` do `calculateSellerPrizes`

        if (!goalData.metinha?.threshold) {
            return { percent: 0, label: 'Metas não definidas', achievedLevels: [] };
        }

        const levels: GoalLevelName[] = ['Metinha', 'Meta', 'Metona', 'Lendária'];
        const allGoals = levels.map(level => {
            const levelKey = level.toLowerCase() as keyof MetricGoals;
            const goalLevel = goalData[levelKey] as { threshold: number } | undefined;
            return { name: level, threshold: goalLevel?.threshold || 0 };
        });

        const achievedLevels = allGoals.filter(g => g.threshold > 0 && sellerValue >= g.threshold);

        let nextGoal, currentGoalBase, nextGoalLabel;
        if (sellerValue >= (goalData.lendaria?.threshold || Infinity)) {
            return { percent: 100, label: 'Nível Lendário Atingido!', achievedLevels: achievedLevels.map(g => g.name) };
        }
        if (sellerValue >= (goalData.metona?.threshold || Infinity)) {
            nextGoal = goalData.lendaria.threshold; currentGoalBase = goalData.metona.threshold; nextGoalLabel = 'Lendária';
        } else if (sellerValue >= (goalData.meta?.threshold || Infinity)) {
            nextGoal = goalData.metona.threshold; currentGoalBase = goalData.meta.threshold; nextGoalLabel = 'Metona';
        } else if (sellerValue >= (goalData.metinha?.threshold || Infinity)) {
            nextGoal = goalData.meta.threshold; currentGoalBase = goalData.metinha.threshold; nextGoalLabel = 'Meta';
        } else {
            nextGoal = goalData.metinha.threshold; currentGoalBase = 0; nextGoalLabel = 'Metinha';
        }

        const range = (nextGoal || 0) - (currentGoalBase || 0);
        const progressInLevel = range > 0 ? (sellerValue - (currentGoalBase || 0)) / range * 100 : 0;
        
        return {
            percent: Math.min(100, progressInLevel),
            label: `Próximo Nível: ${nextGoalLabel || ''}`,
            achievedLevels: achievedLevels.map(g => g.name),
        };
    }, [sellerData, goals, criterion]);

    return { sellerData, currentUserRank, totalSellers: sortedSellersForRank.length, goalProgress, sellersWithPrizes };
};

// ####################################################################
// ### 3. SUB-COMPONENTES DE UI ###
// ####################################################################

const TeamGoalCard = ({ sellers, goals }: { sellers: SellerWithPrize[], goals: Goals | null }) => {
    const { metinhaThreshold, bonus } = useMemo(() => ({
        metinhaThreshold: goals?.salesValue?.metinha?.threshold || 0,
        bonus: goals?.teamGoalBonus || 0,
    }), [goals]);

    if (metinhaThreshold === 0) return null;

    const sellersWhoReachedMetinha = sellers.filter(s => (s.salesValue || 0) >= metinhaThreshold).length;
    const totalSellers = sellers.length;
    const progress = totalSellers > 0 ? (sellersWhoReachedMetinha / totalSellers) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="size-5" />Meta de Equipe</CardTitle>
                <CardDescription>
                    Se todos atingirem a &quot;Metinha&quot; de vendas, cada um ganha um bônus de <span className="font-bold text-green-400">{formatCurrency(bonus)}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Progresso</span>
                        <span className="font-bold">{sellersWhoReachedMetinha} de {totalSellers} vendedores</span>
                    </div>
                    <Progress value={progress} />
                </div>
            </CardContent>
        </Card>
    );
};

const SprintPrizesSummaryCard = ({ sellerData }: { sellerData: SellerWithPrize }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-yellow-400"/> Prémios da Corridinha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Pontos Extras Ganhos</h3>
                    <p className="text-2xl font-bold text-primary">{sellerData.extraPoints.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Impacto no Prémio de Pontos</h3>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(sellerData.prizes.points)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Este é o seu prémio total na categoria de Pontos (metas + corridinhas).</p>
                </div>
            </CardContent>
        </Card>
    )
}

// ####################################################################
// ### 4. COMPONENTE PRINCIPAL ###
// ####################################################################
const SellerPerformancePage = () => {
    const [criterion, setCriterion] = useState<RankingCriterion>('points');
    const { sellerData, currentUserRank, goalProgress, sellersWithPrizes } = useSellerPerformance(criterion);
    const { goals, isAuthReady } = useSellerContext();

    if (!isAuthReady || !sellerData) {
        return <DashboardSkeleton />;
    }

    const criterionLabel = TABS_CONFIG.find(t => t.value === criterion)?.label || '';
    const prizeForCriterion = criterion === 'totalPrize' 
        ? sellerData.totalPrize 
        : (sellerData.prizes as any)[criterion as keyof typeof sellerData.prizes] || 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Trophy className="size-8 text-primary" /><h1 className="text-3xl font-bold">Meu Desempenho</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sua Posição no Ranking Geral</CardTitle>
                            <CardDescription>Sua classificação atual com base no critério: <span className="font-bold text-primary">{criterionLabel}</span>.</CardDescription>
                        </CardHeader>
                        <CardContent><p className="text-4xl font-bold">Posição: {currentUserRank !== -1 ? `${currentUserRank + 1}º` : 'N/A'}</p></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Análise por Critério</CardTitle><CardDescription>Selecione um critério para visualizar seus resultados em detalhes.</CardDescription></CardHeader>
                        <CardContent>
                            <Tabs value={criterion} onValueChange={(value) => setCriterion(value as RankingCriterion)}>
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-input p-1 h-auto">
                                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => (
                                        <TabsTrigger key={value} value={value}><Icon className="mr-2 size-4" />{label}</TabsTrigger>
                                    ))}
                                 </TabsList>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {criterion === 'totalPrize' ? (
                        <Card>
                            <CardHeader><CardTitle>Prêmio Total Acumulado</CardTitle><CardDescription>A soma de todos os seus prêmios no ciclo atual.</CardDescription></CardHeader>
                            <CardContent>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Valor Total do Prêmio</h3>
                                    <p className="text-2xl font-bold text-green-400">{formatCurrency(sellerData.totalPrize)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                         <Card>
                            <CardHeader><CardTitle>Detalhes por {criterionLabel}</CardTitle><CardDescription>Seu resultado detalhado para o critério selecionado.</CardDescription></CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Prêmio Recebido (Neste Critério)</h3>
                                        <p className="text-2xl font-bold text-green-400">{formatCurrency(prizeForCriterion)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Seu Resultado</h3>
                                        <p className="text-2xl font-bold">{
                                            criterion === 'points' ? sellerData.points.toLocaleString('pt-BR') :
                                            criterion === 'pa' ? sellerData.pa.toLocaleString('pt-BR') :
                                            formatCurrency(sellerData[criterion as keyof Seller] as number)
                                        }</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">Níveis de Meta Atingidos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(goalProgress.achievedLevels.length > 0) ?
                                            goalProgress.achievedLevels.map(level => {
                                                const config = goalLevelConfig[level as GoalLevelName];
                                                return <Badge key={level} variant="outline" className={cn("font-semibold", config.className)}>{config.label}</Badge>;
                                            }) : <Badge variant="secondary">Nenhuma meta atingida</Badge>
                                        }
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">Progresso para Próxima Meta</h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium">{goalProgress.label}</span>
                                            <span className="font-bold">{goalProgress.percent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={goalProgress.percent} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                
                <div className="space-y-8">
                    <TeamGoalCard sellers={sellersWithPrizes} goals={goals} />
                    <SprintPrizesSummaryCard sellerData={sellerData} />
                </div>
            </div>
        </div>
    );
}

export default SellerPerformancePage;
