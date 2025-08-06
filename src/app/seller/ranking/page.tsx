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
  CheckCircle,
  Medal,
  Award,
  Info,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSellerContext } from '@/contexts/SellerContext';
import type { Goals, Seller } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, calculateSellerPrizes } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ####################################################################
// ### 1. TIPOS, CONSTANTES E FUNÇÕES AUXILIARES ###
// ####################################################################

type RankingCriterion = 'totalPrize' | 'salesValue' | 'ticketAverage' | 'pa' | 'points';
type SellerWithPrize = ReturnType<typeof calculateSellerPrizes>;
type GoalLevelName = 'Nenhuma' | 'Metinha' | 'Meta' | 'Metona' | 'Lendária';

const TABS_CONFIG: { value: RankingCriterion | 'salesValue'; label: string; icon: React.ElementType }[] = [
    { value: 'totalPrize', label: 'Prémio Total', icon: Trophy },
    { value: 'salesValue', label: 'Vendas', icon: DollarSign },
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'ticketAverage', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
];

const goalLevelConfig: Record<GoalLevelName, { label: string; className: string }> = {
    'Nenhuma': { label: 'Nenhuma', className: 'bg-muted border-transparent text-muted-foreground' },
    'Metinha': { label: 'Metinha', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    'Meta': { label: 'Meta', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    'Metona': { label: 'Metona', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'Lendária': { label: 'Lendária', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatValue = (value: number, criterion: RankingCriterion | 'salesValue') => {
    if (criterion === 'pa') return value.toFixed(1);
    if (criterion === 'points') return value.toLocaleString('pt-BR');
    return formatCurrency(value);
};

// ####################################################################
// ### 2. CUSTOM HOOK PARA TODA A LÓGICA DE DADOS ###
// ####################################################################

const useSellerPerformance = (criterion: RankingCriterion | 'salesValue') => {
    const { sellers, goals, currentSeller } = useSellerContext();

    const sortedSellers = useMemo(() => {
        const sellersWithPrizes = sellers.map(s => calculateSellerPrizes(s, sellers, goals));
        return [...sellersWithPrizes].sort((a, b) => {
            if (criterion === 'totalPrize') return b.totalPrize - a.totalPrize;
            if (criterion === 'points') return (b.points + b.extraPoints) - (a.points + a.extraPoints);
            return (b[criterion as keyof Seller] as number) - (a[criterion as keyof Seller] as number);
        });
    }, [sellers, goals, criterion]);

    const sellerData = useMemo(() => {
        if (!currentSeller) return null;
        return sortedSellers.find(s => s.id === currentSeller.id);
    }, [currentSeller, sortedSellers]);
    
    const currentUserRank = useMemo(() => {
        if (!sellerData) return -1;
        return sortedSellers.indexOf(sellerData);
    }, [sortedSellers, sellerData]);

    const goalProgress = useMemo(() => {
        if (!sellerData || !goals || criterion === 'totalPrize') return { percent: 0, label: 'N/A', details: '', achievedGoals: [] };
        
        const metric = criterion as keyof Goals;
        const goalData = goals[metric];
        const sellerValue = metric === 'points' 
            ? (sellerData.points || 0) + (sellerData.extraPoints || 0) 
            : sellerData[metric as keyof Seller] || 0;

        if (!goalData?.metinha?.threshold) return { percent: 0, label: "Metas não definidas", details: "N/A", achievedGoals: [] };
        
        const allGoalTiers = [
            { name: 'Lendária', ...goalData.lendaria },
            { name: 'Metona', ...goalData.metona },
            { name: 'Meta', ...goalData.meta },
            { name: 'Metinha', ...goalData.metinha },
        ];

        const achievedGoals = allGoalTiers.filter(g => (sellerValue as number) >= g.threshold && g.threshold > 0);

        let nextGoal, currentGoalBase, nextGoalLabel;
        if (sellerValue >= goalData.lendaria.threshold) return { percent: 100, label: `Nível Lendário Atingido!`, details: formatValue(sellerValue as number, metric), achievedGoals };
        if (sellerValue >= goalData.metona.threshold) { nextGoal = goalData.lendaria.threshold; currentGoalBase = goalData.metona.threshold; nextGoalLabel = 'Lendária'; }
        else if (sellerValue >= goalData.meta.threshold) { nextGoal = goalData.metona.threshold; currentGoalBase = goalData.meta.threshold; nextGoalLabel = 'Metona'; }
        else if (sellerValue >= goalData.metinha.threshold) { nextGoal = goalData.meta.threshold; currentGoalBase = goalData.metinha.threshold; nextGoalLabel = 'Meta'; }
        else { nextGoal = goalData.metinha.threshold; currentGoalBase = 0; nextGoalLabel = 'Metinha'; }

        const range = nextGoal - currentGoalBase;
        const progress = range > 0 ? (( (sellerValue as number) - currentGoalBase) / range) * 100 : 0;
        
        return {
            percent: Math.min(100, progress),
            label: `Próximo Nível: ${nextGoalLabel}`,
            details: `${formatValue(sellerValue as number, metric)} / ${formatValue(nextGoal, metric)}`,
            achievedGoals,
        };
    }, [sellerData, goals, criterion]);

    return { sellerData, sortedSellers, currentUserRank, goalProgress };
};


// ####################################################################
// ### 3. SUB-COMPONENTES VISUAIS ###
// ####################################################################

const PodiumIcon = React.memo(({ rank }: { rank: number }) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Award className="h-6 w-6 text-orange-400" />;
    return <span className="font-bold text-lg text-muted-foreground">{rank + 1}</span>;
});
PodiumIcon.displayName = 'PodiumIcon';


// ####################################################################
// ### 4. COMPONENTE PRINCIPAL DA PÁGINA ###
// ####################################################################

export default function SellerPerformancePage() {
    const [criterion, setCriterion] = useState<RankingCriterion | 'salesValue'>('salesValue');
    const { sellerData, sortedSellers, currentUserRank, goalProgress } = useSellerPerformance(criterion);
    const { currentSeller } = useSellerContext();

    if (!currentSeller || !sellerData) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin size-8" /></div>;
    }

    const sellerValue = criterion === 'totalPrize' 
        ? sellerData.totalPrize 
        : (criterion === 'points' ? sellerData.points + sellerData.extraPoints : sellerData[criterion as keyof Seller]);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Trophy className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Meu Desempenho</h1>
            </div>

            {/* Grid principal que divide a página em duas colunas em ecrãs grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Coluna da Esquerda: Detalhes do desempenho */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sua Posição</CardTitle>
                            <CardDescription>Critério: <span className="font-bold text-primary">{TABS_CONFIG.find(t => t.value === criterion)?.label}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">
                                {currentUserRank !== -1 ? `${currentUserRank + 1}º` : '...'}
                                <span className="text-muted-foreground text-2xl"> / {sortedSellers.length}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Detalhes da Performance</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm text-muted-foreground">Seu Resultado</p>
                                <p className="text-2xl font-bold">{formatValue(sellerValue as number, criterion)}</p>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm text-muted-foreground">Prémio Acumulado (neste critério)</p>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(criterion === 'totalPrize' ? sellerData.totalPrize : (sellerData.prizes[criterion as keyof typeof sellerData.prizes] || 0))}</p>
                            </div>
                            {criterion !== 'totalPrize' && (
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Progresso para a Próxima Meta</h4>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="w-full text-left">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-medium">{goalProgress.label}</span>
                                                        <span className="font-bold">{goalProgress.percent.toFixed(0)}%</span>
                                                    </div>
                                                    <Progress value={goalProgress.percent} className="h-2" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{goalProgress.details}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {goalProgress.achievedGoals.map((goal: any) => (
                                            <Badge key={goal.name} className={goalLevelConfig[goal.name as GoalLevelName]?.className}>{goal.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna da Direita: Ranking Geral */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ranking Geral da Equipa</CardTitle>
                            <CardDescription>Selecione um critério para ver a classificação completa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={criterion} onValueChange={(value) => setCriterion(value as any)}>
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-input p-1 h-auto">
                                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => (
                                        <TabsTrigger key={value} value={value}><Icon className="mr-2 size-4" />{label}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <div className="rounded-md border border-border mt-4 overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[80px] text-center">Pos.</TableHead><TableHead>Vendedor</TableHead><TableHead className="text-right">{TABS_CONFIG.find(t => t.value === criterion)?.label}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {sortedSellers.map((seller, index) => (
                                            <TableRow key={seller.id} className={seller.id === currentSeller.id ? 'bg-primary/10' : ''}>
                                                <TableCell className="text-center"><PodiumIcon rank={index} /></TableCell>
                                                <TableCell className="font-medium">{seller.name}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatValue((criterion === 'totalPrize' ? seller.totalPrize : (criterion === 'points' ? seller.points + seller.extraPoints : seller[criterion as keyof Seller])) as number, criterion)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}