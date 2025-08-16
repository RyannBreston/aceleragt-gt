'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Star, TrendingUp, Trophy, Target } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { calculateSellerPrizes } from '@/lib/client-utils';
import { useMemo } from 'react';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const useTeamStats = () => {
    const { sellers, goals, sprints } = useAdminContext();

    return useMemo(() => {
        console.log("Sellers in useTeamStats: ", sellers)
        const totalSellers = sellers.length;
        if (totalSellers === 0 || !goals) {
            return { totalSellers: 0, currentSales: 0, totalPoints: 0, averageTicket: 0, averagePA: 0, totalPrizes: 0, topSeller: null };
        }
        
        const activeSprint = sprints.find(s => s.isActive) || null;
        const sellersWithPrizes = sellers.map(s => calculateSellerPrizes(s, sellers, goals, activeSprint));
        
        const currentSales = sellersWithPrizes.reduce((acc, seller) => acc + (seller.salesValue || 0), 0);
        const totalPoints = sellersWithPrizes.reduce((acc, seller) => acc + (seller.points || 0), 0);
        const totalTicket = sellersWithPrizes.reduce((acc, seller) => acc + (seller.ticketAverage || 0), 0);
        const totalPA = sellersWithPrizes.reduce((acc, seller) => acc + (seller.pa || 0), 0);
        const totalPrizes = sellersWithPrizes.reduce((acc, seller) => acc + seller.totalPrize, 0);

        const topSeller = [...sellersWithPrizes].sort((a, b) => b.totalPrize - a.totalPrize)[0];

        return {
            totalSellers,
            currentSales,
            totalPoints,
            averageTicket: totalSellers > 0 ? totalTicket / totalSellers : 0,
            averagePA: totalSellers > 0 ? totalPA / totalSellers : 0,
            totalPrizes,
            topSeller,
        };
    }, [sellers, goals, sprints]);
};

export default function DashboardPage() {
    const { isLoading } = useAdminContext();
    const { totalSellers, currentSales, totalPoints, averageTicket, averagePA, totalPrizes, topSeller } = useTeamStats();

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (totalSellers === 0) {
        return (
            <EmptyState 
                Icon={Users}
                title="Nenhum Vendedor Encontrado"
                description="Ainda não há vendedores cadastrados no sistema. Adicione vendedores para começar a ver as estatísticas."
            />
        )
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard Geral</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total de Vendas" value={currentSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
                <StatCard title="Pontos Acumulados" value={totalPoints.toLocaleString('pt-BR')} icon={Star} />
                <StatCard title="Prémios Pagos (Ciclo)" value={totalPrizes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Visão Geral de Vendas</CardTitle>
                        <CardDescription>O gráfico de vendas foi removido temporariamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Gráfico em desenvolvimento.</p>
                       </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo da Equipa</CardTitle>
                        <CardDescription>Métricas chave da sua equipa de vendas neste ciclo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between"><span>Vendedores Ativos</span> <span className="font-bold">{totalSellers}</span></div>
                        <div className="flex justify-between"><span>Ticket Médio</span> <span className="font-bold">{averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                        <div className="flex justify-between"><span>PA Médio</span> <span className="font-bold">{averagePA.toFixed(2)}</span></div>
                        <hr/>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><TrendingUp/>Destaque do Ciclo</h4>
                            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-primary/10 rounded-full"><Trophy className="text-primary"/></div>
                                <div>
                                    <p className="font-bold text-sm">{topSeller?.name}</p>
                                    <p className="text-xs text-green-400 font-semibold">{topSeller?.totalPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em prémios</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target/> Metas Atuais (Exemplo)</CardTitle>
                    <CardDescription>Visualização rápida das principais metas definidas para o ciclo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Esta secção pode ser implementada para mostrar as metas principais (ex: meta de vendas da equipa).</p>
                </CardContent>
            </Card>
        </div>
    );
}
