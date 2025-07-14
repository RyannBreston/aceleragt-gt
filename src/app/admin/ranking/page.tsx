'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, DollarSign, Ticket, Box, Star, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminContext } from '@/contexts/AdminContext'; // Caminho de importação corrigido
import type { Goals, GoalLevel as GoalLevelType, Seller, SalesValueGoals } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, calculateSellerPrizes } from '@/lib/utils';

type RankingCriterion = 'salesValue' | 'ticketAverage' | 'pa' | 'points' | 'totalPrize';
type GoalLevelName = 'Nenhuma' | 'Metinha' | 'Meta' | 'Metona' | 'Lendária';

const goalLevelConfig: Record<GoalLevelName, { label: string; className: string }> = {
  'Nenhuma': { label: 'Nenhuma', className: 'bg-muted border-transparent text-muted-foreground hover:bg-muted' },
  'Metinha': { label: 'Metinha', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  'Meta': { label: 'Meta', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  'Metona': { label: 'Metona', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Lendária': { label: 'Lendária', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function RankingPage() {
  const [criterion, setCriterion] = useState<RankingCriterion>('totalPrize');
  const { sellers: sellersData, goals: goalsData } = useAdminContext();

  const sortedSellers = useMemo(() => {
    const sellersWithPrizes = sellersData.map(seller => 
        calculateSellerPrizes(seller, sellersData, goalsData)
    );

    return sellersWithPrizes.sort((a, b) => {
        if (criterion === 'totalPrize') {
          return b.totalPrize - a.totalPrize;
        }
        if (criterion === 'points') {
            return (b.points + b.extraPoints) - (a.points + a.extraPoints);
        }
        return b[criterion as keyof Seller] - a[criterion as keyof Seller];
    });
  }, [sellersData, goalsData, criterion]);
  
  const getCriterionLabel = (currentCriterion: RankingCriterion) => {
    switch (currentCriterion) {
      case 'salesValue':
        return 'Valor de Venda';
      case 'ticketAverage':
        return 'Ticket Médio';
      case 'pa':
        return 'PA';
      case 'points':
        return 'Pontos';
      case 'totalPrize':
        return 'Prémio Total';
      default:
        return '';
    }
  };

  const formatValue = (value: number, currentCriterion: RankingCriterion | 'salesValue') => {
    if (currentCriterion === 'pa') {
        return value.toFixed(1);
    }
    if (currentCriterion === 'points') {
        return value.toLocaleString('pt-BR');
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatPrize = (value: number) => {
     return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const getGoalProgress = (value: number, criterion: Exclude<RankingCriterion, 'totalPrize'>) => {
    const goals = goalsData[criterion];
    let nextGoal, currentGoalBase, nextGoalLabel, progress;

    if (!goals?.lendaria) return { percent: 0, label: 'N/A', details: 'N/A'};

    if (value >= goals.lendaria.threshold) {
      return { percent: 100, label: `Nível Lendário Atingido!`, details: `${formatValue(value, criterion)}` };
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

    if (nextGoal <= 0 || nextGoal - currentGoalBase <= 0) {
      progress = value > 0 ? 100 : 0;
    } else {
      progress = Math.min(100, ((value - currentGoalBase) / (nextGoal - currentGoalBase)) * 100);
    }
    
    return { 
      percent: progress, 
      label: `Próximo Nível: ${nextGoalLabel}`,
      details: `${formatValue(value, criterion)} / ${formatValue(nextGoal, criterion)}`
    };
  };
  
  const getRankIndicator = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6" style={{ color: '#C0C0C0' }} />;
    if (index === 2) return <Award className="h-6 w-6" style={{ color: '#CD7F32' }} />;
    return <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Trophy className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Ranking de Vendedores</h1>
      </div>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Filtros do Ranking</CardTitle>
          <CardDescription>Selecione o critério para visualizar a classificação dos vendedores.</CardDescription>
        </CardHeader>
        <CardContent>
            <div>
                <Label className="text-sm font-medium mb-2 block">Critério de Classificação</Label>
                <Tabs value={criterion} onValueChange={(value) => setCriterion(value as RankingCriterion)}>
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-input p-1 h-auto">
                        <TabsTrigger value="totalPrize" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                            <Trophy className="mr-2 size-4" /> Prêmio Total
                        </TabsTrigger>
                        <TabsTrigger value="salesValue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                            <DollarSign className="mr-2 size-4" /> Vendas
                        </TabsTrigger>
                        <TabsTrigger value="ticketAverage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                            <Ticket className="mr-2 size-4" /> Ticket Médio
                        </TabsTrigger>
                        <TabsTrigger value="pa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                            <Box className="mr-2 size-4" /> PA
                        </TabsTrigger>
                          <TabsTrigger value="points" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                            <Star className="mr-2 size-4" /> Pontos
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Classificação por {getCriterionLabel(criterion)}</CardTitle>
           <CardDescription>
              Visualizando a classificação dos vendedores com base nos dados mais recentes.
           </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] text-center">Posição</TableHead>
                      <TableHead>Vendedor</TableHead>
                      {criterion !== 'totalPrize' && (
                        <TableHead className="text-right">{getCriterionLabel(criterion)}</TableHead>
                      )}
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <span>Prémio</span>
                            <Award className="size-4 text-green-400" />
                        </div>
                      </TableHead>
                      {criterion !== 'totalPrize' && (
                        <>
                          <TableHead className="w-[300px] text-center">Nível da Meta</TableHead>
                          <TableHead className="w-[280px]">Progresso</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSellers.map((seller, index) => {
                      const sellerValue = criterion === 'totalPrize' 
                        ? seller.totalPrize
                        : (criterion === 'points' ? seller.points + seller.extraPoints : seller[criterion as keyof Seller]);

                      const prizeForCriterion = seller.prizes[criterion as keyof typeof seller.prizes] || 0;
                      const prizeToDisplay = criterion === 'totalPrize' ? seller.totalPrize : prizeForCriterion;
                      
                      const criterionGoals = criterion !== 'totalPrize' ? goalsData[criterion as keyof Goals] : null;
                      
                      const allGoals: Array<{ name: GoalLevelName; threshold: number; prize: number }> = criterionGoals ? [
                        { name: 'Metinha', ...(criterionGoals as GoalLevelType).metinha },
                        { name: 'Meta', ...(criterionGoals as GoalLevelType).meta },
                        { name: 'Metona', ...(criterionGoals as GoalLevelType).metona },
                        { name: 'Lendária', ...(criterionGoals as GoalLevelType).lendaria },
                      ] : [];

                      const { percent, label, details } = criterion !== 'totalPrize' ? getGoalProgress(sellerValue as number, criterion as Exclude<RankingCriterion, 'totalPrize'>) : { percent: 0, label: '', details: ''};
                      
                      return (
                        <TableRow key={seller.id} className={index < 3 ? 'bg-card-foreground/5' : ''}>
                          <TableCell className="font-bold text-lg flex justify-center items-center h-full py-4">
                            {getRankIndicator(index)}
                          </TableCell>
                          <TableCell className="font-medium">{seller.name}</TableCell>
                          {criterion !== 'totalPrize' && (
                            <TableCell className="text-right font-semibold">{formatValue(sellerValue as number, criterion)}</TableCell>
                          )}
                           <TableCell className="text-right font-semibold text-green-400">
                             <div className="flex items-center justify-end gap-1.5">
                                <span>{formatPrize(prizeToDisplay)}</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="p-2 text-sm text-left text-popover-foreground space-y-2 max-w-xs">
                                                <h4 className="font-bold border-b pb-1 mb-1">Composição do Prémio Total: {formatPrize(seller.totalPrize)}</h4>
                                                <div className="flex justify-between gap-4"><span>Vendas:</span> <span className="font-bold">{formatPrize(seller.prizes.salesValue)}</span></div>
                                                <div className="flex justify-between gap-4"><span>T. Médio:</span> <span className="font-bold">{formatPrize(seller.prizes.ticketAverage)}</span></div>
                                                <div className="flex justify-between gap-4"><span>PA:</span> <span className="font-bold">{formatPrize(seller.prizes.pa)}</span></div>
                                                <div className="flex justify-between gap-4"><span>Pontos:</span> <span className="font-bold">{formatPrize(seller.prizes.points)}</span></div>
                                                {seller.teamBonusApplied && (
                                                    <div className="flex justify-between gap-4 pt-1 border-t mt-1"><span>Bónus Equipa:</span> <span className="font-bold">{formatPrize(100)}</span></div>
                                                )}
                                                {seller.topScorerBonus > 0 && (
                                                    <div className="flex justify-between gap-4 pt-1 border-t mt-1 text-yellow-400"><span>Prémio Top Pontos:</span> <span className="font-bold">{formatPrize(seller.topScorerBonus)}</span></div>
                                                )}
                                                {(seller.points + seller.extraPoints) < goalsData.points.metinha.threshold && (
                                                    <div className="flex justify-between gap-4 pt-1 border-t mt-1 text-destructive"><span>Não elegível:</span> <span className="font-bold">Não atingiu a metinha de pontos</span></div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                          </TableCell>
                          {criterion !== 'totalPrize' && criterionGoals && (
                            <>
                              <TableCell className="text-center">
                                <div className="flex justify-center items-center gap-1.5 flex-wrap">
                                  {allGoals.map((goal) => {
                                    const isAchieved = (sellerValue as number) >= goal.threshold && goal.threshold > 0;
                                    const config = goalLevelConfig[goal.name as GoalLevelName];
                                    return (
                                      <TooltipProvider key={goal.name}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge
                                              className={cn(
                                                'transition-all duration-300 ease-in-out',
                                                isAchieved
                                                  ? `${config.className} scale-110 border-2 border-current shadow-lg`
                                                  : 'bg-muted border-transparent text-muted-foreground opacity-60 hover:bg-muted'
                                              )}
                                            >
                                              {config.label}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="space-y-1 text-xs text-left">
                                              <p className="font-semibold">{goal.label}</p>
                                              <p>Meta: {formatValue(goal.threshold, criterion as 'salesValue' | 'ticketAverage' | 'pa' | 'points')}</p>
                                              <p>Prémio: <span className="font-bold text-green-400">{formatPrize(goal.prize)}</span></p>
                                              {criterion === 'salesValue' && goal.name === 'Lendária' && (goalsData.salesValue as SalesValueGoals).performanceBonus && (
                                                <p className="text-xs italic text-primary/80 pt-1 border-t border-border/20 mt-1">
                                                    Bónus: +{formatPrize((goalsData.salesValue as SalesValueGoals).performanceBonus!.prize)} a cada {formatPrize((goalsData.salesValue as SalesValueGoals).performanceBonus!.per)} extra
                                                </p>
                                              )}
                                              <p>Seu valor: {formatValue(sellerValue as number, criterion)}</p>
                                              <p className={cn("font-bold", isAchieved ? 'text-green-400' : 'text-yellow-400')}>
                                                {isAchieved ? 'Atingida!' : 'Pendente'}
                                              </p>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col gap-1.5 text-left w-full">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium">{label}</span>
                                          <span className="text-sm font-bold">{percent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={percent} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-purple-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{details}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}