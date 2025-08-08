'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartTooltipContent,
  ChartContainer
} from '@/components/ui/chart';
import type { SalesEntry } from '@/lib/types';
import { format } from 'date-fns';

type SalesChartProps = {
  salesData: SalesEntry[];
};

export default function SalesChartComponent({ salesData }: SalesChartProps) {
  const chartData = salesData.map(entry => ({
    date: format(entry.date, 'MMM d'),
    salesValue: entry.salesValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Value Over Time</CardTitle>
        <CardDescription>A chart showing the trend of sales value.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
         <ChartContainer config={{
            salesValue: {
              label: "Sales",
              color: "hsl(var(--accent))",
            },
         }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  cursor={{
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 2,
                    strokeDasharray: '3 3',
                  }}
                  content={<ChartTooltipContent
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                    indicator="dot" 
                   />}
                />
                <Line
                  type="monotone"
                  dataKey="salesValue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
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