/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, DollarSign, Ticket, Box, Star, Loader2 } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import type { Goals, MetricGoals, SellerWithPrizes } from '@/lib/types';
import { calculateSellerPrizes } from '@/lib/client-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ####################################################################
// ### 1. TIPOS, CONSTANTES E FORMATAÇÃO ###
// ####################################################################

type RankingCriterion = 'prizes_total' | 'sales_value' | 'ticket_average' | 'pa' | 'points';
type GoalLevelName = 'Metinha' | 'Meta' | 'Metona' | 'Lendária';

const TABS_CONFIG: { value: RankingCriterion; label: string; icon: React.ElementType }[] = [
    { value: 'prizes_total', label: 'Prémio Total', icon: Trophy },
    { value: 'sales_value', label: 'Vendas', icon: DollarSign },
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'ticket_average', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
];

const goalLevelConfig: Record<GoalLevelName, { label: string; className: string; }> = {
    'Metinha': { label: 'Metinha', className: 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' },
    'Meta': { label: 'Meta', className: 'border-green-500/50 text-green-500 bg-green-500/10' },
    'Metona': { label: 'Metona', className: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
    'Lendária': { label: 'Lendária', className: 'border-purple-500/50 text-purple-400 bg-purple-500/10' },
};

const formatCurrency = (value?: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


// ####################################################################
// ### 2. HOOKS DE DADOS ###
// ####################################################################

const useRankingData = (criterion: RankingCriterion) => {
    const { sellers, goals, sprints } = useAdminContext();
    
    const sellersWithPrizes = useMemo(() => {
        if (!goals || !sellers) return [];
        const activeSprint = sprints.find(s => s.is_active) || null;
        return sellers.map(s => calculateSellerPrizes(s, sellers, goals, activeSprint));
    }, [sellers, goals, sprints]);

    const sortedSellers = useMemo(() => {
        return [...sellersWithPrizes].sort((a, b) => {
            if (criterion === 'prizes_total') return b.prizes.total - a.prizes.total;
            const valueA = (a as any)[criterion] || 0;
            const valueB = (b as any)[criterion] || 0;
            return valueB - valueA;
        });
    }, [sellersWithPrizes, criterion]);

    return sortedSellers;
};

const useGoalProgress = (sellerData: SellerWithPrizes | null, criterion: RankingCriterion, goals: Goals | null) => {
    return useMemo(() => {
        if (!sellerData || !goals?.data || criterion === 'prizes_total') {
            return { percent: 0, label: '', achievedLevels: [] };
        }
        
        const metric = criterion as keyof Omit<Goals['data'], 'gamification' | 'teamGoalBonus'>;
        const goalData = goals.data[metric];
        
        if (typeof goalData !== 'object' || goalData === null) {
            return { percent: 0, label: 'Metas não definidas', achievedLevels: [] };
        }

        const sellerValue = (sellerData as any)[metric] as number || 0;

        if (!goalData.metinha?.threshold) {
            return { percent: 0, label: 'Metas não definidas', achievedLevels: [] };
        }

        const levels: GoalLevelName[] = ['Metinha', 'Meta', 'Metona', 'Lendária'];
        const allGoals = levels.map(level => {
            const levelKey = level.toLowerCase() as keyof MetricGoals;
            const goalLevel = (goalData as any)[levelKey] as { threshold: number } | undefined;
            return { name: level, threshold: goalLevel?.threshold || 0 };
        });

        const achievedLevels = allGoals.filter(g => g.threshold > 0 && sellerValue >= g.threshold);

        let nextGoal, currentGoalBase, nextGoalLabel;
        if (sellerValue >= (goalData.lendaria?.threshold || Infinity)) {
            return { percent: 100, label: 'Nível Lendário Atingido!', achievedLevels: achievedLevels.map(g => g.name) };
        }
        if (sellerValue >= (goalData.metona?.threshold || Infinity)) {
            nextGoal = goalData.lendaria?.threshold; currentGoalBase = goalData.metona?.threshold; nextGoalLabel = 'Lendária';
        } else if (sellerValue >= (goalData.meta?.threshold || Infinity)) {
            nextGoal = goalData.metona?.threshold; currentGoalBase = goalData.meta?.threshold; nextGoalLabel = 'Metona';
        } else if (sellerValue >= (goalData.metinha?.threshold || Infinity)) {
            nextGoal = goalData.meta?.threshold; currentGoalBase = goalData.metinha?.threshold; nextGoalLabel = 'Meta';
        } else {
            nextGoal = goalData.metinha?.threshold; currentGoalBase = 0; nextGoalLabel = 'Metinha';
        }

        const range = (nextGoal || 0) - (currentGoalBase || 0);
        const progressInLevel = range > 0 ? (sellerValue - (currentGoalBase || 0)) / range * 100 : 0;
        
        return {
            percent: Math.min(100, progressInLevel),
            label: `Próximo Nível: ${nextGoalLabel || ''}`,
            achievedLevels: achievedLevels.map(g => g.name),
        };
    }, [sellerData, goals, criterion]);
};

// ####################################################################
// ### 3. SUB-COMPONENTES DE UI ###
// ####################################################################

const PodiumIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 2) return <Award className="h-5 w-5 text-orange-400" />;
    return <span className="font-semibold text-sm w-5 text-center">{rank + 1}</span>;
});
PodiumIcon.displayName = 'PodiumIcon';

const PerformanceDetailCard = ({ seller, criterion }: { seller: SellerWithPrizes | null, criterion: RankingCriterion }) => {
    const { goals } = useAdminContext();
    const goalProgress = useGoalProgress(seller, criterion, goals);

    if (!seller) {
        return (
            <Card className="sticky top-24">
                <CardHeader><CardTitle>Detalhes do Vendedor</CardTitle><CardDescription>Selecione um vendedor da lista para ver seus detalhes.</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-center h-48"><p className="text-muted-foreground">Nenhum vendedor selecionado</p></CardContent>
            </Card>
        );
    }
    
    const criterionLabel = TABS_CONFIG.find(t => t.value === criterion)?.label || '';
    const prizeForCriterion = criterion === 'prizes_total'
        ? seller.prizes.total
        : (seller.prizes.details.find(d => d.reason.includes(criterion))?.amount || 0);
    const sellerResult = (seller as any)[criterion] as number || 0; 
            
    const isCurrency = criterion !== 'points' && criterion !== 'pa';

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>{seller.name}</CardTitle>
                <CardDescription>Desempenho detalhado para o critério <span className="font-bold text-primary">{criterionLabel}</span>.</CardDescription></CardHeader>
            <CardContent className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Prémio (Critério)</h3>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(prizeForCriterion)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Resultado</h3>
                        <p className="text-2xl font-bold">{isCurrency ? formatCurrency(sellerResult) : sellerResult.toLocaleString('pt-BR')}</p>
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
    );
};


// ####################################################################
// ### 4. COMPONENTE PRINCIPAL ###
// ####################################################################

export default function RankingPage() {
    const { isLoading } = useAdminContext();
    const [criterion, setCriterion] = useState<RankingCriterion>('prizes_total');
    const [selectedSeller, setSelectedSeller] = useState<SellerWithPrizes | null>(null);
    const sortedSellers = useRankingData(criterion);
    
    useEffect(() => {
        if (sortedSellers.length > 0 && !selectedSeller) {
            setSelectedSeller(sortedSellers[0]);
        } else if (sortedSellers.length === 0) {
            setSelectedSeller(null);
        }
    }, [sortedSellers, selectedSeller]);

    const handleSellerSelect = (seller: SellerWithPrizes) => {
        setSelectedSeller(seller);
    };
    
    const getResultForSeller = (seller: SellerWithPrizes) => {
        if (criterion === 'prizes_total') {
            return formatCurrency(seller.prizes.total);
        }
        const result = (seller as any)[criterion] as number || 0;
        return criterion === 'pa' || criterion === 'points' ? result.toLocaleString('pt-BR') : formatCurrency(result);
    };

    if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4"><Trophy className="size-8 text-primary" /><h1 className="text-3xl font-bold">Ranking de Vendedores</h1></div>

            <Card>
                <CardHeader><CardTitle>Análise por Critério</CardTitle><CardDescription>Selecione um critério para classificar e analisar os vendedores.</CardDescription></CardHeader>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-4">
                     <Card>
                        <CardHeader className='pb-4'><CardTitle>Classificação</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {sortedSellers.map((seller, index) => (
                                <button key={seller.id} onClick={() => handleSellerSelect(seller)} className={cn(
                                    "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4",
                                    selectedSeller?.id === seller.id ? 'bg-primary/10 ring-2 ring-primary/80' : 'hover:bg-muted/50'
                                )}>
                                    <PodiumIcon rank={index} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{seller.name}</p>
                                        <p className="text-xs text-muted-foreground">{TABS_CONFIG.find(t => t.value === criterion)?.label}</p>
                                    </div>
                                    <p className="text-sm font-bold">{getResultForSeller(seller)}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                   <PerformanceDetailCard seller={selectedSeller} criterion={criterion} />
                </div>
            </div>
        </div>
    );
}