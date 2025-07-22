'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Seller } from '@/lib/types';

export default function SalesOverviewChart({ sellers }: { sellers: Seller[] }) {
  const chartData = useMemo(() => {
    if (!sellers || sellers.length === 0) {
      return [];
    }
    return sellers.map(seller => ({
      name: seller.name.split(' ')[0], // Usar apenas o primeiro nome para caber melhor
      'Vendas (R$)': seller.salesValue,
      'Pontos': seller.points + seller.extraPoints,
      'PA': seller.pa,
      'Ticket Médio (R$)': seller.ticketAverage,
    }));
  }, [sellers]);

  // Formata os números no eixo Y e no tooltip para serem mais legíveis
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toLocaleString('pt-BR')}k`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <Card className="bg-card border-border shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>Visão Geral de Vendas e Pontos por Vendedor</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Adiciona uma div pai com altura definida para o gráfico */}
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatValue} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '14px' }} />
                <Bar yAxisId="left" dataKey="Vendas (R$)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Pontos" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Nenhum dado de vendas para exibir.</p>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}