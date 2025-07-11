'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { History, Medal, Trophy, Award, DollarSign, Ticket, Box, Star } from 'lucide-react';
import { useSellerContext } from '@/app/seller/layout';
import type { Seller, Goals, SalesValueGoals } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const calculateSellerPrizes = (seller: Seller, goals: Goals) => {
    const prizes: Record<keyof Omit<Goals, 'salesValue' | 'gamification'>, number> = {
        salesValue: 0,
        ticketAverage: 0,
        pa: 0,
        points: 0,
    };
    const allCriteria: Array<keyof typeof prizes> = ['salesValue', 'ticketAverage', 'pa', 'points'];
    allCriteria.forEach(crit => {
        if (crit === 'salesValue' || crit === 'ticketAverage' || crit === 'pa' || crit === 'points') {
            const goalLevels = goals[crit];
            const sellerValue = crit === 'points' ? seller.points + seller.extraPoints : seller[crit];
            let currentPrize = 0;
            if (sellerValue >= goalLevels.metinha.threshold) currentPrize += goalLevels.metinha.prize;
            if (sellerValue >= goalLevels.meta.threshold) currentPrize += goalLevels.meta.prize;
            if (sellerValue >= goalLevels.metona.threshold) currentPrize += goalLevels.metona.prize;
            if (sellerValue >= goalLevels.lendaria.threshold) currentPrize += goalLevels.lendaria.prize;
            if (crit === 'salesValue') {
                const salesGoals = goalLevels as SalesValueGoals;
                if (seller.salesValue > salesGoals.lendaria.threshold && salesGoals.performanceBonus && salesGoals.performanceBonus.per > 0) {
                    const excessSales = seller.salesValue - salesGoals.lendaria.threshold;
                    const bonusUnits = Math.floor(excessSales / salesGoals.performanceBonus.per);
                    currentPrize += bonusUnits * salesGoals.performanceBonus.prize;
                }
            }
            prizes[crit] = currentPrize;
        }
    });
    const totalPrize = Object.values(prizes).reduce((sum, p) => sum + p, 0);
    return { ...seller, totalPrize };
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function HistoricoPage() {
  const { cycleHistory, currentSeller } = useSellerContext();
  const reversedHistory = [...cycleHistory].reverse();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <History className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Meu Histórico de Desempenho</h1>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
            <CardTitle>Resultados de Ciclos Anteriores</CardTitle>
            <CardDescription>Compare sua evolução ao longo dos ciclos de premiação.</CardDescription>
        </CardHeader>
        <CardContent>
             {reversedHistory.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                {reversedHistory.map((snapshot) => {
                    const allSellersRanked = snapshot.sellers.map(s => calculateSellerPrizes(s, snapshot.goals))
                        .sort((a, b) => b.totalPrize - a.totalPrize);
                    
                    const myData = allSellersRanked.find(s => s.id === currentSeller.id);
                    const myRank = myData ? allSellersRanked.findIndex(s => s.id === currentSeller.id) + 1 : null;

                    if (!myData) return null;

                    return (
                    <AccordionItem value={snapshot.id} key={snapshot.id}>
                        <AccordionTrigger className='text-lg'>
                           Ciclo Finalizado em: {format(new Date(snapshot.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
                                        <Trophy className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{myRank}º</div>
                                        <p className="text-xs text-muted-foreground">de {allSellersRanked.length} vendedores</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Prêmio Total</CardTitle>
                                        <DollarSign className="h-4 w-4 text-green-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(myData.totalPrize)}</div>
                                        <p className="text-xs text-muted-foreground">Total acumulado no ciclo</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
                                        <Star className="h-4 w-4 text-yellow-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{(myData.points + myData.extraPoints).toLocaleString('pt-BR')}</div>
                                         <p className="text-xs text-muted-foreground">Cursos, quizzes e bônus</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Vendas no Ciclo</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(myData.salesValue)}</div>
                                         <p className="text-xs text-muted-foreground">Valor total vendido</p>
                                    </CardContent>
                                </Card>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                    )
                })}
                </Accordion>
             ) : (
                 <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
                    <History className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Nenhum histórico de ciclo disponível.</p>
                    <p className="text-sm">
                        Seu desempenho em ciclos anteriores aparecerá aqui.
                    </p>
                </div>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
