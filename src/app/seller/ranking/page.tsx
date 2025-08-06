'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, DollarSign, Ticket, Box, Star, Medal, Award, Info } from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext';
import type { Seller } from '@/lib/types';
import { calculateSellerPrizes } from '@/lib/utils';

// ####################################################################
// ### 1. TIPOS E CONSTANTES ###
// ####################################################################

type RankingCriterion = 'totalPrize' | 'salesValue' | 'ticketAverage' | 'pa' | 'points';
type SellerWithPrize = ReturnType<typeof calculateSellerPrizes>;

const TABS_CONFIG: { value: RankingCriterion; label: string; icon: React.ElementType }[] = [
    { value: 'totalPrize', label: 'Prémio Total', icon: Trophy },
    { value: 'salesValue', label: 'Vendas', icon: DollarSign },
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'ticketAverage', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
];

// ####################################################################
// ### 2. CUSTOM HOOK PARA A LÓGICA DE DADOS ###
// ####################################################################

const useSellerRanking = (criterion: RankingCriterion) => {
    const { sellers, goals, currentSeller } = useSellerContext();

    const sortedSellers = useMemo(() => {
        const sellersWithPrizes = sellers.map(s => calculateSellerPrizes(s, sellers, goals));
        return [...sellersWithPrizes].sort((a, b) => {
            if (criterion === 'totalPrize') return b.totalPrize - a.totalPrize;
            if (criterion === 'points') return (b.points + b.extraPoints) - (a.points + a.extraPoints);
            return (b[criterion as keyof Seller] as number) - (a[criterion as keyof Seller] as number);
        });
    }, [sellers, goals, criterion]);

    const currentUserRank = useMemo(() => {
        if (!currentSeller) return -1;
        return sortedSellers.findIndex(s => s.id === currentSeller.id);
    }, [sortedSellers, currentSeller]);

    return { sortedSellers, currentUserRank };
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

const formatValue = (value: number, criterion: RankingCriterion) => {
    if (criterion === 'pa') return value.toFixed(1);
    if (criterion === 'points') return value.toLocaleString('pt-BR');
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// ####################################################################
// ### 4. COMPONENTE PRINCIPAL DA PÁGINA (MAIS LIMPO) ###
// ####################################################################

export default function SellerRankingPage() {
    const [criterion, setCriterion] = useState<RankingCriterion>('totalPrize');
    const { sortedSellers, currentUserRank } = useSellerRanking(criterion);
    const { currentSeller } = useSellerContext();

    if (!currentSeller) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;
    }

    const currentCriterionLabel = TABS_CONFIG.find(t => t.value === criterion)?.label || '';

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Trophy className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Meu Desempenho no Ranking</h1>
            </div>

            {/* Card com a Posição Atual do Vendedor */}
            <Card>
                <CardHeader>
                    <CardTitle>Sua Posição Atual</CardTitle>
                    <CardDescription>
                        Classificação geral com base no critério: <span className="font-bold text-primary">{currentCriterionLabel}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">
                        {currentUserRank !== -1 ? (
                            <>
                                <span className="text-primary">{currentUserRank + 1}º</span>
                                <span className="text-muted-foreground text-2xl"> / {sortedSellers.length}</span>
                            </>
                        ) : 'A calcular...'}
                    </p>
                </CardContent>
            </Card>
            
            {/* Tabela de Ranking Geral */}
            <Card>
                <CardHeader>
                    <CardTitle>Ranking Geral da Equipa</CardTitle>
                    <CardDescription>Selecione um critério para ver a classificação completa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs value={criterion} onValueChange={(value) => setCriterion(value as RankingCriterion)}>
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-input p-1 h-auto">
                            {TABS_CONFIG.map(({ value, label, icon: Icon }) => (
                                <TabsTrigger key={value} value={value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                                    <Icon className="mr-2 size-4" /> {label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="rounded-md border border-border mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Posição</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead className="text-right">{currentCriterionLabel}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedSellers.map((seller, index) => {
                                    const sellerValue = criterion === 'totalPrize' 
                                        ? seller.totalPrize 
                                        : (criterion === 'points' ? seller.points + seller.extraPoints : seller[criterion as keyof Seller]);
                                    
                                    return (
                                        <TableRow key={seller.id} className={seller.id === currentSeller.id ? 'bg-primary/10' : ''}>
                                            <TableCell className="text-center"><PodiumIcon rank={index} /></TableCell>
                                            <TableCell className="font-medium">{seller.name}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatValue(sellerValue as number, criterion)}</TableCell>
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