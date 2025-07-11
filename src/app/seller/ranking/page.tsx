'use client';

import React, {useMemo, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Trophy,
  DollarSign,
  Ticket,
  Box,
  Star,
  Users,
  CheckCircle,
  Info
} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {useSellerContext} from '@/app/seller/layout';
import type {Goals, SalesValueGoals, Seller} from '@/lib/types';
import {Progress} from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {cn, calculateSellerPrizes} from '@/lib/utils';

type RankingCriterion =
  | 'ticketAverage'
  | 'pa'
  | 'points'
  | 'totalPrize';
type GoalLevelName = 'Nenhuma' | 'Metinha' | 'Meta' | 'Metona' | 'Lendária';

const goalLevelConfig: Record<GoalLevelName, {label: string; className: string}> =
  {
    Nenhuma: {
      label: 'Nenhuma',
      className:
        'bg-muted border-transparent text-muted-foreground hover:bg-muted',
    },
    Metinha: {
      label: 'Metinha',
      className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
    Meta: {
      label: 'Meta',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    Metona: {
      label: 'Metona',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    Lendária: {
      label: 'Lendária',
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  };

const TeamGoalProgress = ({ sellers, goals }: { sellers: Seller[], goals: Goals }) => {
    if (!sellers || !goals?.salesValue?.metinha) {
        return null;
    }
    
    const teamBonus = 100;

    const sellersWhoReachedGoal = sellers.filter(s => s.salesValue >= goals.salesValue.metinha.threshold && goals.salesValue.metinha.threshold > 0);
    const isGoalAchievable = sellers.length > 1;
    const isGoalAchieved = isGoalAchievable && sellersWhoReachedGoal.length === sellers.length;
    const progress = isGoalAchievable ? (sellersWhoReachedGoal.length / sellers.length) * 100 : 0;

    const formatPrizeValue = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Card className="bg-card/80 shadow-xl rounded-2xl ring-1 ring-white/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="size-6 text-secondary" />
                    <span>Meta de Equipe</span>
                </CardTitle>
                <CardDescription>
                    Se todos atingirem a "Metinha" de vendas,
                    cada um ganha um bônus de <span className="font-bold text-green-400">{formatPrizeValue(teamBonus)}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {!isGoalAchievable ? (
                     <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 text-muted-foreground">
                        <div>
                            <h4 className="font-bold">Mais Vendedores Necessários</h4>
                            <p className="text-sm">A meta de equipe é ativada com no mínimo 2 vendedores.</p>
                        </div>
                    </div>
                ) : isGoalAchieved ? (
                    <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-green-400">
                        <CheckCircle className="size-8" />
                        <div>
                            <h4 className="font-bold">Parabéns, Equipe!</h4>
                            <p className="text-sm">Meta atingida! O bônus foi adicionado ao seu prêmio.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-muted-foreground">Progresso</span>
                            <span className="font-bold">{sellersWhoReachedGoal.length} de {sellers.length} vendedores</span>
                        </div>
                        <Progress value={progress} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function RankingPage() {
  const [criterion, setCriterion] =
    useState<RankingCriterion | 'salesValue'>('totalPrize');
  const {
    sellers: sellersData,
    goals: goalsData,
    currentSeller,
  } = useSellerContext();

  const tabs: { value: RankingCriterion | 'salesValue'; label: string; icon: React.ElementType }[] = [
    { value: 'totalPrize', label: 'Prêmio Total', icon: Trophy },
    { value: 'salesValue', label: 'Vendas', icon: DollarSign },
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'ticketAverage', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
  ];

  const sortedSellers = useMemo(() => {
    const teamGoalMet = sellersData.length > 1 && sellersData.every(s => s.salesValue >= goalsData.salesValue.metinha.threshold && goalsData.salesValue.metinha.threshold > 0);
    const teamBonus = 100;

    const topScorer = sellersData.length > 0 ? sellersData.reduce((max, seller) => (max.points + max.extraPoints) > (seller.points + seller.extraPoints) ? max : seller) : null;

    const sellersWithPrizes = sellersData.map(seller => {
        const calculated = calculateSellerPrizes(seller, goalsData);
        let { totalPrize } = calculated;
        
        if (teamGoalMet) {
          totalPrize += teamBonus;
        }

        if (topScorer && seller.id === topScorer.id) {
          totalPrize += (goalsData.points.topScorerPrize || 0);
        }

        return { ...calculated, totalPrize };
    });

    return sellersWithPrizes.sort((a, b) => {
      if (criterion === 'totalPrize') {
        return b.totalPrize - a.totalPrize;
      }
      if (criterion === 'points') {
        return (b.points + b.extraPoints) - (a.points + a.extraPoints);
      }
      return b[criterion] - a[criterion];
    });
  }, [sellersData, goalsData, criterion]);

  const currentUserRank = useMemo(() => {
    if (!currentSeller) return 0;
    const rank = sortedSellers.findIndex(s => s.id === currentSeller.id);
    return rank + 1;
  }, [sortedSellers, currentSeller]);

  const getCriterionLabel = (currentCriterion: RankingCriterion | 'salesValue') => {
    const tab = tabs.find(t => t.value === currentCriterion);
    return tab ? tab.label : '';
  };

  const formatValue = (value: number, currentCriterion: RankingCriterion | 'salesValue') => {
    if (currentCriterion === 'pa') {
      return value.toFixed(1);
    }
    if (currentCriterion === 'points') {
      return value.toLocaleString('pt-BR');
    }
    return `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  const formatPrize = (value: number) => {
    return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  };

  const getGoalProgress = (value: number, criterion: RankingCriterion | 'salesValue') => {
    if (criterion === 'totalPrize')
      return {percent: 100, label: 'N/A', details: 'N/A'};
    const goals = goalsData[criterion];
    let nextGoal, currentGoalBase, nextGoalLabel, progress;

    if (value >= goals.lendaria.threshold) {
      return {
        percent: 100,
        label: `Nível Lendário Atingido!`,
        details: `${formatValue(value, criterion)}`,
      };
    }
    if (value >= goals.metona.threshold) {
      nextGoal = goals.lendaria.threshold;
      currentGoalBase = goals.metona.threshold;
      nextGoalLabel = 'Lendária';
    } else if (value >= goals.meta.threshold) {
      nextGoal = goals.metona.threshold;
      currentGoalBase = goals.meta.threshold;
      nextGoalLabel = 'Metona';
    } else if (value >= goals.metinha.threshold) {
      nextGoal = goals.meta.threshold;
      currentGoalBase = goals.metinha.threshold;
      nextGoalLabel = 'Meta';
    } else {
      nextGoal = goals.metinha.threshold;
      currentGoalBase = 0;
      nextGoalLabel = 'Metinha';
    }

    if (nextGoal - currentGoalBase <= 0) {
      progress = value > 0 ? 100 : 0;
    } else {
      progress = Math.min(
        100,
        ((value - currentGoalBase) / (nextGoal - currentGoalBase)) * 100
      );
    }

    return {
      percent: progress,
      label: `Próximo Nível: ${nextGoalLabel}`,
      details: `${formatValue(value, criterion)} / ${formatValue(nextGoal, criterion)}`,
    };
  };
  
  const sellerData = sortedSellers.find(s => s.id === currentSeller.id);

  if (!sellerData) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <p>Carregando seus dados de performance...</p>
        </div>
    )
  }
  
  const sellerValue =
    criterion === 'totalPrize'
      ? sellerData.totalPrize
      : criterion === 'points'
      ? sellerData.points + sellerData.extraPoints
      : sellerData[criterion as keyof typeof sellerData];

  const criterionGoals =
    criterion !== 'totalPrize' ? goalsData[criterion] : null;

  const allGoals: Array<{
    name: GoalLevelName;
    threshold: number;
    prize: number;
  }> = criterionGoals
    ? [
        {name: 'Metinha', ...criterionGoals.metinha},
        {name: 'Meta', ...criterionGoals.meta},
        {name: 'Metona', ...criterionGoals.metona},
        {name: 'Lendária', ...criterionGoals.lendaria},
      ]
    : [];

  const {percent, label, details} = getGoalProgress(
    sellerValue,
    criterion
  );

  const prizeToDisplay =
    criterion === 'totalPrize'
      ? sellerData.totalPrize
      : (sellerData.prizes[criterion as keyof typeof sellerData.prizes] || 0);


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Trophy className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Meu Desempenho</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sua Posição no Ranking Geral</CardTitle>
          <CardDescription>
            Sua classificação atual com base no critério:{' '}
            <span className="font-bold text-primary">
              {getCriterionLabel(criterion)}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {currentUserRank > 0 ? (
              <>
                <span className="text-muted-foreground">Posição:</span>{' '}
                <span className="text-primary">{currentUserRank}º</span>
              </>
            ) : (
              'Carregando sua posição...'
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Análise por Critério</CardTitle>
              <CardDescription>
                Selecione um critério para visualizar seus resultados em detalhes.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs
                  value={criterion}
                  onValueChange={value =>
                    setCriterion(value as RankingCriterion | 'salesValue')
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-input p-1 h-auto">
                    {tabs.map(tab => (
                       <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
                      >
                        <tab.icon className="mr-2 size-4" /> {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Detalhes por {getCriterionLabel(criterion)}</CardTitle>
              <CardDescription>
                Seu resultado detalhado para o critério selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={cn(
                        "flex flex-col space-y-1 rounded-lg border p-4",
                        (criterion === 'totalPrize' || criterion === 'salesValue') && "sm:col-span-2"
                    )}>
                        <p className="text-sm text-muted-foreground">Prêmio Recebido (Neste Critério)</p>
                        <p className="text-3xl font-bold text-green-400">{formatPrize(prizeToDisplay)}</p>
                    </div>

                    {criterion !== 'totalPrize' && criterion !== 'salesValue' && (
                      <div className="flex flex-col space-y-1 rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">Seu Resultado</p>
                          <p className="text-3xl font-bold">
                              {formatValue(sellerValue, criterion)}
                          </p>
                      </div>
                    )}
                </div>

                {criterion !== 'totalPrize' && criterionGoals && (
                <>
                    <div>
                        <h4 className="font-semibold mb-3">Níveis de Meta Atingidos</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {allGoals.map((goal) => {
                            const isAchieved = sellerValue >= goal.threshold;
                            const config = goalLevelConfig[goal.name as GoalLevelName];
                            return (
                                <TooltipProvider key={goal.name}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Badge
                                        className={cn(
                                        'transition-all duration-300 ease-in-out',
                                        isAchieved && goal.threshold > 0
                                            ? `${config.className} scale-110 border-2 border-current shadow-lg`
                                            : 'bg-muted border-transparent text-muted-foreground opacity-60 hover:bg-muted'
                                        )}
                                    >
                                        {config.label}
                                    </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <div className="space-y-1 text-xs text-left">
                                        <p className="font-semibold">
                                        {goal.name}
                                        </p>
                                        <p>
                                        Meta:{' '}
                                        {formatValue(
                                            goal.threshold,
                                            criterion
                                        )}
                                        </p>
                                        <p>
                                        Prêmio:{' '}
                                        <span className="font-bold text-green-400">
                                            {formatPrize(goal.prize)}
                                        </span>
                                        </p>
                                        {criterion === 'salesValue' &&
                                        goal.name === 'Lendária' &&
                                        (goalsData.salesValue as SalesValueGoals)
                                            .performanceBonus && (
                                            <p className="text-xs italic text-primary/80 pt-1 border-t border-border/20 mt-1">
                                            Bônus: +
                                            {formatPrize(
                                                (goalsData.salesValue as SalesValueGoals)
                                                .performanceBonus!.prize
                                            )}{' '}
                                            a cada{' '}
                                            {formatPrize(
                                                (goalsData.salesValue as SalesValueGoals)
                                                .performanceBonus!.per
                                            )}{' '}
                                            extra
                                            </p>
                                        )}
                                        {criterion !== 'salesValue' && <p>
                                        Seu valor:{' '}
                                        {formatValue(sellerValue, criterion)}
                                        </p>}
                                        <p
                                        className={cn(
                                            'font-bold',
                                            isAchieved
                                            ? 'text-green-400'
                                            : 'text-yellow-400'
                                        )}
                                        >
                                        {isAchieved
                                            ? 'Atingida!'
                                            : 'Pendente'}
                                        </p>
                                    </div>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            );
                            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-3">Progresso para Próxima Meta</h4>
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col gap-1.5 text-left w-full">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                    {label}
                                    </span>
                                    <span className="text-sm font-bold">
                                    {percent.toFixed(0)}%
                                    </span>
                                </div>
                                <Progress
                                    value={percent}
                                    className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary"
                                />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {criterion === 'salesValue' ? (
                                    <p>Acompanhe seu progresso para a próxima meta de vendas.</p>
                                ) : (
                                    <p>{details}</p>
                                )}
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </>
                )}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-1">
             <TeamGoalProgress sellers={sellersData} goals={goalsData} />
        </div>
      </div>
    </div>
  );
}
