'use server';

/**
 * @fileOverview AI agent to analyze sales trends and identify key insights.
 *
 * - analyzeSalesTrends - A function that analyzes sales data for trends and anomalies.
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
  prompt: `You are an expert sales data analyst. Analyze the provided sales data to identify trends,
anomalies, and top-performing products.

Sales Data ({{timeFrame}}): {{{salesData}}}

Provide a summary of the sales trends, identify the top-performing products, and provide key insights
into what is driving sales performance. Be concise and clear.
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
      throw new Error('AI failed to generate analysis. Please try again.');
    }
    return output;
  }
);
