'use server';

/**
 * @fileOverview Agente de IA para analisar tendências de vendas e identificar insights importantes.
 *
 * - analyzeSalesTrends - Uma função que analisa dados de vendas em busca de tendências e anomalias.
 */

import {ai} from '@/ai/genkit';
import { 
  AnalyzeSalesTrendsInputSchema,
  AnalyzeSalesTrendsOutputSchema,
  type AnalyzeSalesTrendsInput,
  type AnalyzeSalesTrendsOutput,
} from '@/lib/types';


export async function analyzeSalesTrends(
  input: AnalyzeSalesTrendsInput
): Promise<AnalyzeSalesTrendsOutput> {
  return analyzeSalesTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSalesTrendsPrompt',
  input: {schema: AnalyzeSalesTrendsInputSchema},
  output: {schema: AnalyzeSalesTrendsOutputSchema},
  // ✅ PROMPT TRADUZIDO PARA PORTUGUÊS
  prompt: `Você é um analista de dados de vendas especialista. Analise os dados de vendas fornecidos para identificar tendências,
anomalias e produtos de melhor desempenho.

Dados de Vendas ({{timeFrame}}): {{{salesData}}}

Forneça um resumo das tendências de vendas, identifique os produtos de melhor desempenho e ofereça insights importantes
sobre o que está a impulsionar o desempenho das vendas. Seja conciso, claro e responda em português.
`,
});

const analyzeSalesTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeSalesTrendsFlow',
    inputSchema: AnalyzeSalesTrendsInputSchema,
    outputSchema: AnalyzeSalesTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('A IA falhou ao gerar a análise. Por favor, tente novamente.');
    }
    return output;
  }
);