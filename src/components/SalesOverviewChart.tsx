'use client';

import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer
} from '@/components/ui/chart';
import type { Seller } from '@/lib/types';

interface SalesOverviewChartProps {
  sellers: Seller[];
}

export default function SalesOverviewChart({ sellers }: SalesOverviewChartProps) {
    const chartData = sellers.map(seller => ({
        name: seller.name.split(' ')[0],
        vendas: seller.salesValue,
    })).sort((a,b) => b.vendas - a.vendas);

    const chartConfig = {
        vendas: {
            label: 'Vendas',
            color: 'hsl(var(--primary))',
        },
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral de Vendas</CardTitle>
        <CardDescription>Comparativo de vendas por vendedor no mês atual.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig as any} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                layout="horizontal"
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
                        indicator="dot"
                    />}
                />
                <Bar dataKey="vendas" fill="var(--color-vendas)" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
