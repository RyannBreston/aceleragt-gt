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
import type { AnalyzeSalesTrendsOutput } from '@/lib/types';
import { SalesEntry } from '@/lib/types';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

type AiInsightsProps = {
  salesData: SalesEntry[];
  analysis: AnalyzeSalesTrendsOutput | null;
  setAnalysis: (analysis: AnalyzeSalesTrendsOutput | null) => void;
};

export default function AiInsights({ salesData, analysis, setAnalysis }: AiInsightsProps) {
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (salesData.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Data',
        description: 'Please add at least two sales entries to perform an analysis.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await analyzeSalesTrends({
        salesData: JSON.stringify(salesData),
        timeFrame,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'There was an error analyzing the sales data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">AI-Powered Insights</CardTitle>
          <CardDescription className="text-xs">Analyze trends in your sales data</CardDescription>
        </div>
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
                <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as 'weekly' | 'monthly')}>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time frame" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAnalyze} disabled={isLoading} className="flex-grow">
                    {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Analyze Sales
                </Button>
            </div>
            {analysis && (
                <div className="space-y-4 pt-4 border-t">
                    <div>
                        <h4 className="font-semibold">Summary</h4>
                        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Top Products</h4>
                        <p className="text-sm text-muted-foreground">{analysis.topProducts}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Key Insights</h4>
                        <p className="text-sm text-muted-foreground">{analysis.insights}</p>
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
