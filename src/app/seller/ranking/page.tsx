'use client';

import React, { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, DollarSign, Ticket, Box, Star, Medal, Award } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Seller } from '@/lib/types';

type RankingCriterion = 'points' | 'sales_value' | 'ticket_average' | 'pa';

const TABS_CONFIG: { value: RankingCriterion; label: string; icon: React.ElementType }[] = [
    { value: 'points', label: 'Pontos', icon: Star },
    { value: 'sales_value', label: 'Vendas', icon: DollarSign },
    { value: 'ticket_average', label: 'Ticket Médio', icon: Ticket },
    { value: 'pa', label: 'PA', icon: Box },
];

// Sub-componente para o Pódio
const Podium = ({ topSellers, criterion }: { topSellers: Seller[], criterion: RankingCriterion }) => {
    const podiumOrder = [1, 0, 2]; // Ordem visual: 2º, 1º, 3º
    const podiumStyles = [
        { rank: 1, icon: Trophy, color: 'text-yellow-400', height: 'h-48' },
        { rank: 2, icon: Medal, color: 'text-gray-400', height: 'h-40' },
        { rank: 3, icon: Award, color: 'text-orange-400', height: 'h-32' },
    ];

    const getSellerResult = (seller: Seller) => {
        const result = seller[criterion] || 0;
        return criterion === 'sales_value' || criterion === 'ticket_average' ? formatCurrency(result) : result.toLocaleString('pt-BR');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Pódio de Honra</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-end gap-4 pt-6">
                {podiumOrder.map(index => {
                    const seller = topSellers[index];
                    const style = podiumStyles.find(p => p.rank === index + 1);
                    if (!seller || !style) return <div key={index} className="w-1/3" />;
                    
                    const { icon: Icon } = style;

                    return (
                        <div key={seller.id} className="flex flex-col items-center w-1/3">
                            <Avatar className="w-16 h-16 border-4 border-primary/50 mb-2">
                                <AvatarFallback className="text-2xl">{seller.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-bold text-center truncate w-full">{seller.name}</p>
                            <Icon className={`w-8 h-8 ${style.color}`} />
                            <div className={`flex items-center justify-center rounded-t-lg bg-muted w-full mt-2 ${style.height}`}>
                                <div className="text-center">
                                    <p className="text-2xl font-black">{style.rank}º</p>
                                    <p className="font-bold text-primary">{getSellerResult(seller)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default function SellerRankingPage() {
    const { sellers, isLoading, currentSeller } = useSellerContext();
    const [criterion, setCriterion] = useState<RankingCriterion>('points');

    const rankedSellers = useMemo(() => {
        if (!sellers) return [];
        // Acessa as propriedades corretas com `sales_value` etc.
        return [...sellers].sort((a, b) => (b[criterion] || 0) - (a[criterion] || 0));
    }, [sellers, criterion]);

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const getSellerResult = (seller: Seller) => {
        const result = seller[criterion] || 0;
        return criterion === 'sales_value' || criterion === 'ticket_average' ? formatCurrency(result) : result.toLocaleString('pt-BR');
    };

    const topThree = rankedSellers.slice(0, 3);

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Trophy /> Ranking Geral</h1>
                <p className="text-muted-foreground">Veja a sua posição e a dos seus colegas em diferentes categorias.</p>
            </div>

            <Tabs value={criterion} onValueChange={(value) => setCriterion(value as RankingCriterion)}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger key={value} value={value}><Icon className="mr-2 size-4" />{label}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            
            {topThree.length >= 3 && <Podium topSellers={topThree} criterion={criterion} />}

            <Card>
                <CardHeader>
                    <CardTitle>Classificação Completa</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">Pos.</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead className="text-right">{TABS_CONFIG.find(t => t.value === criterion)?.label}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedSellers.map((seller, index) => { // Corrigido para iterar sobre todos, não apenas 'restOfSellers'
                                const isCurrentUser = seller.id === currentSeller?.id;
                                return (
                                    <TableRow key={seller.id} className={cn(isCurrentUser && "bg-primary/10")}>
                                        <TableCell className="font-bold text-lg text-center">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className={cn("font-medium", isCurrentUser && "text-primary")}>{seller.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("font-bold text-right", isCurrentUser && "text-primary")}>
                                            {getSellerResult(seller)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}