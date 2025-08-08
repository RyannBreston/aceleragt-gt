'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from 'lucide-react';
import type { Seller } from '@/lib/types';
import type { TooltipProps } from 'recharts';

// ####################################################################
// ### 1. FUNÇÃO AUXILIAR PARA FORMATAÇÃO ###
// ####################################################################
const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
};

// ####################################################################
// ### 2. COMPONENTE TOOLTIP PERSONALIZADO ###
// ####################################################################
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Vendedor
            </span>
            <span className="font-bold text-foreground">{label}</span>
          </div>
          {payload.map((pld) => (
            <div key={pld.dataKey} className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {pld.dataKey}
              </span>
              <span className="font-bold" style={{ color: pld.fill || undefined }}>
                {pld.dataKey?.includes('R$') 
                  ? pld.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : pld.value?.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// ####################################################################
// ### 3. COMPONENTE PARA ESTADO VAZIO ###
// ####################################################################
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <AreaChart className="size-10 mb-2" />
    <p className="text-sm">Nenhum dado de vendas para exibir.</p>
    <p className="text-xs">Adicione vendedores e vendas para ver o gráfico.</p>
  </div>
);

export default function SalesOverviewChart({ sellers }: { sellers: Seller[] }) {
  const chartData = useMemo(() => {
    if (!sellers || sellers.length === 0) {
      return [];
    }
    return [...sellers]
      .sort((a, b) => (b.salesValue || 0) - (a.salesValue || 0))
      .map(seller => ({
        name: seller.name.split(' ')[0],
        'Vendas (R$)': seller.salesValue || 0,
        'Pontos': (seller.points || 0) + (seller.extraPoints || 0),
      }));
  }, [sellers]);

  return (
    <Card className="bg-card border-border shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>Visão Geral de Vendas e Pontos</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5, }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={formatCurrency}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--muted), 0.3)' }} />
                <Legend iconSize={12} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="Vendas (R$)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Pontos" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <EmptyState />
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}