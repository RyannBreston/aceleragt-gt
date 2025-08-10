/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, DollarSign, Ticket, Box, Star, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAdminContext } from '@/contexts/AdminContext';
import type { Goals, Seller } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateSellerPrizes } from '@/lib/client-utils';

// Tipos e Constantes
type RankingCriterion = 'totalPrize' | 'salesValue' | 'ticketAverage' | 'pa' | 'points';
type SellerWithPrize = ReturnType<typeof calculateSellerPrizes>;

// ####################################################################
// ### 1. COMPONENTES VISUAIS PEQUENOS E REUTILIZÁVEIS ###
// ####################################################################

const PodiumIcon = memo(({ rank }: { rank: number }) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Award className="h-6 w-6 text-orange-400" />;
    return <span className="font-bold text-lg text-muted-foreground">{rank + 1}</span>;
});
PodiumIcon.displayName = 'PodiumIcon';

const PrizeTooltip = memo(({ seller }: { seller: SellerWithPrize }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground cursor-pointer" /></TooltipTrigger>
            <TooltipContent>
                <div className="p-2 text-sm text-left text-popover-foreground space-y-2 max-w-xs">
                    <h4 className="font-bold border-b pb-1 mb-1">Composição do Prémio: {formatCurrency(seller.totalPrize)}</h4>
                    {/* --- CORRIGIDO AQUI --- */}
                    <div className="flex justify-between gap-4"><span>Vendas:</span> <span className="font-bold">{formatCurrency((seller.prizes as any).salesValue)}</span></div>
                    <div className="flex justify-between gap-4"><span>T. Médio:</span> <span className="font-bold">{formatCurrency(seller.prizes.ticketAverage)}</span></div>
                    <div className="flex justify-between gap-4"><span>PA:</span> <span className="font-bold">{formatCurrency(seller.prizes.pa)}</span></div>
                    <div className="flex justify-between gap-4"><span>Pontos:</span> <span className="font-bold">{formatCurrency(seller.prizes.points)}</span></div>
                    {seller.teamBonusApplied && <div className="flex justify-between gap-4 pt-1 border-t mt-1"><span>Bónus Equipa:</span> <span className="font-bold">{formatCurrency(100)}</span></div>}
                    {seller.topScorerBonus > 0 && <div className="flex justify-between gap-4 pt-1 border-t mt-1 text-yellow-400"><span>Top Pontos:</span> <span className="font-bold">{formatCurrency(seller.topScorerBonus)}</span></div>}
                </div>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
));
PrizeTooltip.displayName = 'PrizeTooltip';


// ####################################################################
// ### 2. CUSTOM HOOK PARA A LÓGICA DE DADOS ###
// ####################################################################

const useRankingData = (sellers: Seller[], goals: Goals | null, criterion: RankingCriterion) => {
    return useMemo(() => {
        if (!goals) return [];
        const sellersWithPrizes = sellers.map(seller => calculateSellerPrizes(seller, sellers, goals));
        
        return [...sellersWithPrizes].sort((a, b) => {
            if (criterion === 'totalPrize') return b.totalPrize - a.totalPrize;
            if (criterion === 'points') return (b.points + b.extraPoints) - (a.points + a.extraPoints);
            // --- CORRIGIDO PARA SER MAIS SEGURO ---
            const valueA = (a as any)[criterion] || 0;
            const valueB = (b as any)[criterion] || 0;
            return valueB - valueA;
        });
    }, [sellers, goals, criterion]);
};

// Funções de formatação
const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const formatValue = (value: number, criterion: RankingCriterion) => {
    if (isNaN(value)) return '0';
    if (criterion === 'pa') return value.toFixed(1);
    if (criterion === 'points') return value.toLocaleString('pt-BR');
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


// ####################################################################
// ### 3. COMPONENTE DA LINHA DA TABELA (ROW) ###
// ####################################################################

const RankingRow = memo(({ seller, rank, criterion }: { seller: SellerWithPrize, rank: number, criterion: RankingCriterion }) => {
    // --- CORRIGIDO PARA SER MAIS SEGURO ---
    const sellerValue = criterion === 'totalPrize' ? seller.totalPrize : (criterion === 'points' ? seller.points + seller.extraPoints : (seller as any)[criterion]);
    const prizeToDisplay = criterion === 'totalPrize' ? seller.totalPrize : (seller.prizes as any)[criterion] || 0;

    return (
        <TableRow className={rank < 3 ? 'bg-card-foreground/5' : ''}>
            <TableCell className="font-bold text-lg flex justify-center items-center h-full py-4"><PodiumIcon rank={rank} /></TableCell>
            <TableCell className="font-medium">{seller.name}</TableCell>
            {criterion !== 'totalPrize' && <TableCell className="text-right font-semibold">{formatValue(sellerValue as number, criterion)}</TableCell>}
            <TableCell className="text-right font-semibold text-green-400">
                <div className="flex items-center justify-end gap-1.5">
                    <span>{formatCurrency(prizeToDisplay)}</span>
                    <PrizeTooltip seller={seller} />
                </div>
            </TableCell>
        </TableRow>
    );
});
RankingRow.displayName = 'RankingRow';


// ####################################################################
// ### 4. COMPONENTE PRINCIPAL DA PÁGINA ###
// ####################################################################

export default function RankingPage() {
    const [criterion, setCriterion] = useState<RankingCriterion>('totalPrize');
    const { sellers, goals } = useAdminContext();
    const sortedSellers = useRankingData(sellers, goals, criterion);

    const criterionConfig = {
        totalPrize: { label: 'Prémio Total', Icon: Trophy },
        salesValue: { label: 'Vendas', Icon: DollarSign },
        ticketAverage: { label: 'Ticket Médio', Icon: Ticket },
        pa: { label: 'PA', Icon: Box },
        points: { label: 'Pontos', Icon: Star },
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
                    <CardDescription>Selecione o critério para visualizar a classificação.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Critério de Classificação</Label>
                        <Tabs value={criterion} onValueChange={(value) => setCriterion(value as RankingCriterion)}>
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-input p-1 h-auto">
                                {Object.entries(criterionConfig).map(([key, { label, Icon }]) => (
                                    <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                                        <Icon className="mr-2 size-4" /> {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Classificação por {criterionConfig[criterion].label}</CardTitle>
                    <CardDescription>Visualizando a classificação dos vendedores com base nos dados mais recentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Posição</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    {criterion !== 'totalPrize' && <TableHead className="text-right">{criterionConfig[criterion].label}</TableHead>}
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-2"><span>Prémio</span><Award className="size-4 text-green-400" /></div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedSellers.map((seller, index) => (
                                    <RankingRow key={seller.id} seller={seller} rank={index} criterion={criterion} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
