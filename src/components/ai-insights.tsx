'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { analyzeSalesTrends } from '@/ai/flows/analyze-sales-trends';
import type { AnalyzeSalesTrendsOutput, Seller } from '@/lib/types';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

type AiInsightsProps = {
  sellers: Seller[];
};

export default function AiInsights({ sellers }: AiInsightsProps) {
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeSalesTrendsOutput | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (sellers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Dados Insuficientes',
        description: 'É necessário ter pelo menos um vendedor com dados para realizar a análise.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await analyzeSalesTrends({
        salesData: JSON.stringify(sellers),
        timeFrame,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Análise Falhou',
        description: 'Ocorreu um erro ao analisar os dados de vendas. Por favor, tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Insights com IA</span>
          </CardTitle>
          <CardDescription className="text-xs mt-1">Analise as tendências de vendas da equipa</CardDescription>
        </div>
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
                <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as 'weekly' | 'monthly')}>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAnalyze} disabled={isLoading} className="flex-grow">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analisar Vendas
                </Button>
            </div>
            {analysis && (
                <div className="space-y-4 pt-4 border-t">
                    <div>
                        <h4 className="font-semibold">Resumo</h4>
                        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Produtos em Destaque</h4>
                        <p className="text-sm text-muted-foreground">{analysis.topProducts}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Principais Insights</h4>
                        <p className="text-sm text-muted-foreground">{analysis.insights}</p>
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}