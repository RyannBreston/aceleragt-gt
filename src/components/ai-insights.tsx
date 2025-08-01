'use client';

import { useState, useEffect } from 'react';
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
import { Skeleton } from './ui/skeleton'; // Importe o componente Skeleton

// ####################################################################
// ### 1. COMPONENTE DE RESULTADOS ###
// ####################################################################
// Separa a lógica de exibição dos resultados para maior clareza.
const AnalysisResult = ({ analysis }: { analysis: AnalyzeSalesTrendsOutput }) => (
  <div className="space-y-4 pt-4 border-t">
    <div>
      <h4 className="font-semibold">Resumo</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
    </div>
    <div>
      <h4 className="font-semibold">Produtos em Destaque</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.topProducts}</p>
    </div>
    <div>
      <h4 className="font-semibold">Principais Insights</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.insights}</p>
    </div>
  </div>
);

// Componente para o estado de carregamento dos resultados
const AnalysisSkeleton = () => (
    <div className="space-y-4 pt-4 border-t">
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
        </div>
    </div>
);


type AiInsightsProps = {
  sellers: Seller[];
};

export default function AiInsights({ sellers }: AiInsightsProps) {
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeSalesTrendsOutput | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (isInitialLoad = false) => {
    if (sellers.length === 0) {
      if (!isInitialLoad) { // Só mostra o toast se não for no carregamento inicial
          toast({
            variant: 'destructive',
            title: 'Dados Insuficientes',
            description: 'É necessário ter pelo menos um vendedor com dados para realizar a análise.',
          });
      }
      return;
    }

    setIsLoading(true);
    if (!isInitialLoad) { // Só limpa a análise anterior se for um clique do utilizador
        setAnalysis(null);
    }

    try {
      // ####################################################################
      // ### 2. OTIMIZAÇÃO DE PAYLOAD ###
      // ####################################################################
      // Mapeamos os dados dos vendedores para enviar apenas o que é necessário para a análise.
      const relevantSalesData = sellers.map(seller => ({
        name: seller.name,
        salesValue: seller.salesValue,
        ticketAverage: seller.ticketAverage,
        pa: seller.pa,
        points: seller.points,
      }));

      const result = await analyzeSalesTrends({
        // Enviamos apenas os dados relevantes, reduzindo o tamanho da requisição.
        salesData: JSON.stringify(relevantSalesData),
        timeFrame,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Análise Falhou',
        description: 'Ocorreu um erro ao analisar os dados. Por favor, tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ####################################################################
  // ### 3. MELHORIA DE UX: ANÁLISE INICIAL ###
  // ####################################################################
  // Executa a análise automaticamente quando o componente é montado.
  useEffect(() => {
    handleAnalyze(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez no início

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
                <Button onClick={() => handleAnalyze()} disabled={isLoading} className="flex-grow">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analisar Vendas
                </Button>
            </div>
            
            {/* Exibe o esqueleto durante o carregamento ou o resultado quando disponível */}
            {isLoading ? <AnalysisSkeleton /> : analysis && <AnalysisResult analysis={analysis} />}

        </div>
      </CardContent>
    </Card>
  );
}