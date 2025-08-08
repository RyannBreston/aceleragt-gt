'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
  ChartContainer,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import type { QuizResult } from '@/lib/types';
import type { ChartConfig } from '@/components/ui/chart';

interface PerformanceChartProps {
  data: QuizResult[];
}

const chartConfig: ChartConfig = {
  Pontuação: {
    label: 'Sua Pontuação',
    color: 'hsl(var(--primary))',
  },
  Total: {
    label: 'Total de Perguntas',
    color: 'hsl(var(--muted-foreground))',
  },
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data.map((res) => ({
    date: res.date,
    Pontuação: res.score,
    Total: res.total,
  }));

  return (
    <Card className="w-full mt-8 bg-card border-border">
      <CardHeader>
        <CardTitle>Histórico de Desempenho</CardTitle>
        <CardDescription>Sua pontuação nos últimos quizzes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, (dataMax: number) => Math.max(5, dataMax)]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                 <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="Pontuação"
                  type="monotone"
                  stroke="var(--color-Pontuação)"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: 'var(--color-Pontuação)',
                    strokeWidth: 2,
                    stroke: 'hsl(var(--background))'
                  }}
                />
                 <Line
                  dataKey="Total"
                  type="monotone"
                  stroke="var(--color-Total)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
