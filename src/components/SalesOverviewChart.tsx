'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from 'lucide-react'; // Ícone para o estado vazio
import type { Seller } from '@/lib/types';

// ####################################################################
// ### 1. FUNÇÃO AUXILIAR PARA FORMATAÇÃO ###
// ####################################################################
// Formata os números para o eixo Y e para o tooltip, tornando-os mais legíveis.
const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
};

// ####################################################################
// ### 2. COMPONENTE TOOLTIP PERSONALIZADO ###
// ####################################################################
// Cria uma caixa de informações personalizada que segue o tema visual da aplicação.
const CustomTooltip = ({ active, payload, label }: any) => {
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
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {pld.dataKey}
              </span>
              <span className="font-bold" style={{ color: pld.fill }}>
                {pld.dataKey.includes('R$') 
                  ? pld.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : pld.value.toLocaleString('pt-BR')}
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
// Um componente visualmente mais agradável para quando não há dados.
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <AreaChart className="size-10 mb-2" />
    <p className="text-sm">Nenhum dado de vendas para exibir.</p>
    <p className="text-xs">Adicione vendedores e vendas para ver o gráfico.</p>
  </div>
);

export default function SalesOverviewChart({ sellers }: { sellers: Seller[] }) {
  // O uso de useMemo aqui já é uma excelente prática de otimização.
  const chartData = useMemo(() => {
    if (!sellers || sellers.length === 0) {
      return [];
    }
    // Ordena os vendedores por valor de vendas para uma melhor visualização
    return [...sellers]
      .sort((a, b) => b.salesValue - a.salesValue)
      .map(seller => ({
        name: seller.name.split(' ')[0], // Usar apenas o primeiro nome
        'Vendas (R$)': seller.salesValue,
        'Pontos': seller.points + seller.extraPoints,
      }));
  }, [sellers]);

  return (
    <Card className="bg-card border-border shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>Visão Geral de Vendas e Pontos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* A div pai com altura definida é crucial para o ResponsiveContainer funcionar corretamente */}
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