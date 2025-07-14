'use client';

import { useSellerContext } from '@/contexts/SellerContext'; // Caminho de importação corrigido
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {format} from 'date-fns';
import {Star, Ticket, Box, DollarSign} from 'lucide-react';
import type {Mission, GoalLevels, Goals, Seller} from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import React from 'react';

type GoalLevelName = 'Nenhuma' | 'Metinha' | 'Meta' | 'Metona' | 'Lendária';
type Criterion = keyof Omit<Goals, 'gamification'>;

const goalLevelConfig: Record<GoalLevelName, { label: string; className: string }> = {
  'Nenhuma': { label: 'Nenhuma', className: 'bg-muted border-transparent text-muted-foreground hover:bg-muted' },
  'Metinha': { label: 'Metinha', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  'Meta': { label: 'Meta', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  'Metona': { label: 'Metona', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Lendária': { label: 'Lendária', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};


const getGoalProgressDetails = (value: number, criterion: Criterion, goals: Goals) => {
    if (!goals || !goals[criterion]) return { percent: 0, label: 'N/A', details: 'N/A' };
    const goalLevels = goals[criterion];
    let nextGoal, currentGoalBase, nextGoalLabel, progress;
    
    const formatValue = (val: number) => {
      if (criterion === 'pa') return val.toFixed(1);
      if (criterion === 'points') return val.toLocaleString('pt-BR');
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (value >= goalLevels.lendaria.threshold) {
      return { percent: 100, label: `Nível Lendário Atingido!`, details: `${formatValue(value)}` };
    }
    if (value >= goalLevels.metona.threshold) {
      nextGoal = goalLevels.lendaria.threshold;
      currentGoalBase = goalLevels.metona.threshold;
      nextGoalLabel = 'Lendária';
    } else if (value >= goalLevels.meta.threshold) {
      nextGoal = goalLevels.metona.threshold;
      currentGoalBase = goals.meta.threshold;
      nextGoalLabel = 'Metona';
    } else if (value >= goalLevels.metinha.threshold) {
      nextGoal = goals.meta.threshold;
      currentGoalBase = goals.metinha.threshold;
      nextGoalLabel = 'Meta';
    } else {
      nextGoal = goalLevels.metinha.threshold;
      currentGoalBase = 0;
      nextGoalLabel = 'Metinha';
    }

    if (nextGoal - currentGoalBase <= 0) {
      progress = 100;
    } else {
      progress = Math.min(100, ((value - currentGoalBase) / (nextGoal - currentGoalBase)) * 100);
    }
    
    return { 
      percent: progress, 
      label: `Próximo Nível: ${nextGoalLabel}`,
      details: `${formatValue(value)} / ${formatValue(nextGoal)}`
    };
  };

const MetricCard = ({ title, icon: Icon, value, criterion, goals, currentSeller }: { title: string, icon: React.ElementType, value: number, criterion: Criterion, goals: Goals, currentSeller: Seller }) => {
    const goalLevels = goals[criterion];
    if (!goalLevels) return null; // Adiciona verificação para evitar erro
    const { percent, label, details } = getGoalProgressDetails(value, criterion, goals);
    
    const allGoalTiers: Array<{ name: GoalLevelName; threshold: number; prize: number }> = [
        { name: 'Metinha', ...goalLevels.metinha },
        { name: 'Meta', ...goalLevels.meta },
        { name: 'Metona', ...goalLevels.metona },
        { name: 'Lendária', ...goalLevels.lendaria },
    ];
    
    const formatValue = (val: number, crit: Criterion) => {
      if (crit === 'pa') return val.toFixed(1);
      if (crit === 'points') return val.toLocaleString('pt-BR');
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <Card className="shadow-lg rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Icon className="size-4 text-muted-foreground" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div>
              <div className="text-3xl font-bold mb-4">{formatValue(value, criterion)}</div>
              
              <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">METAS ATINGIDAS</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allGoalTiers.map(goal => {
                      const isAchieved = value >= goal.threshold && goal.threshold > 0;
                      if (!isAchieved) return null;
                      const config = goalLevelConfig[goal.name];
                      return (
                         <Badge key={goal.name} className={cn('transition-all', config.className)}>{config.label}</Badge>
                      )
                    })}
                    {allGoalTiers.every(goal => value < goal.threshold || goal.threshold === 0) && (
                      <Badge className={cn('transition-all', goalLevelConfig['Nenhuma'].className)}>Nenhuma</Badge>
                    )}
                  </div>
              </div>
            </div>

            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-xs font-bold">{percent.toFixed(0)}%</p>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{details}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
    )
}


export default function SellerDashboardPage() {
  const {currentSeller, missions, goals} = useSellerContext();
  const totalPoints = currentSeller.points + currentSeller.extraPoints;

  const formatReward = (mission: Mission) => {
    if (mission.rewardType === 'cash') {
      return mission.rewardValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }
    return `${mission.rewardValue} pts`;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Olá, {currentSeller.name}!</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a) de volta ao seu painel. Aqui está o seu desempenho.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Total de Pontos" icon={Star} value={totalPoints} criterion="points" goals={goals} currentSeller={currentSeller} />
          <MetricCard title="Ticket Médio" icon={Ticket} value={currentSeller.ticketAverage} criterion="ticketAverage" goals={goals} currentSeller={currentSeller} />
          <MetricCard title="Produtos por Atendimento (PA)" icon={Box} value={currentSeller.pa} criterion="pa" goals={goals} currentSeller={currentSeller} />
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Missões Ativas</CardTitle>
          <CardDescription>
            Participe desses desafios para ganhar pontos extras!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Missão</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Recompensa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.length > 0 ? missions.map(mission => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {mission.description}
                    </TableCell>
                    <TableCell>
                      {mission.startDate ? format(mission.startDate, 'dd/MM/yy') : ''} -{' '}
                      {mission.endDate ? format(mission.endDate, 'dd/MM/yy') : ''}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatReward(mission)}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Nenhuma missão ativa no momento.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}