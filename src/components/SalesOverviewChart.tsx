'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdminContext } from '@/contexts/AdminContext';
import { EmptyState } from '@/components/EmptyState';
import { BarChart as BarChartIcon } from 'lucide-react';

export function SalesOverviewChart() {
    const { sellers } = useAdminContext();

    const chartData = useMemo(() => {
        if (!sellers || sellers.length === 0) {
            return [];
        }
        return sellers
            .map(seller => ({
                name: seller.name.split(' ')[0], // Pega o primeiro nome
                'Vendas (R$)': seller.salesValue || 0,
                'Pontos': seller.points || 0,
            }));
    }, [sellers]);

    if (sellers.length === 0) {
        return (
            <div className="h-[350px] w-full">
                 <EmptyState 
                    Icon={BarChartIcon}
                    title="Sem dados para exibir"
                    description="Os dados de vendas e pontos aparecerão aqui quando houver vendedores."
                />
            </div>
        )
    }

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            borderColor: 'hsl(var(--border))' 
                        }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Vendas (R$)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="Pontos" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
