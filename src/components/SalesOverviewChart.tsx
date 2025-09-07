'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { Seller } from '@/lib/types';

interface SalesOverviewChartProps {
  sellers: Seller[];
}

export default function SalesOverviewChart({ sellers }: SalesOverviewChartProps) {
  // Ordena os vendedores pelo valor de vendas para mostrar os top 5
  const sortedSellers = [...sellers]
    .sort((a, b) => (b.sales_value || 0) - (a.sales_value || 0))
    .slice(0, 5);

  const data = sortedSellers.map(seller => ({
    name: seller.name.split(' ')[0], // Pega apenas o primeiro nome
    vendas: seller.sales_value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
        />
        <Legend />
        <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}