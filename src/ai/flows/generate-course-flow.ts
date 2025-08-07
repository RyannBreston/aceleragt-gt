'use client';

import {ai} from '@/ai/genkit';
import {
  GenerateCourseInputSchema,
  GenerateCourseOutputSchema,
} from '@/lib/types';
import {generate} from '@genkit-ai/ai';
// ✅ CORREÇÃO APLICADA AQUI: O nome do modelo foi atualizado.
import {gemini10Pro} from '@genkit-ai/googleai';

export const generateCourse = ai.defineFlow(
  {
    name: 'generateCourseFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: GenerateCourseOutputSchema,
  },
  async ({topic}) => {
    const prompt = `Gere um curso sobre "${topic}". O curso deve ter um título criativo, conteúdo em Markdown e um quiz com pelo menos 3 perguntas.`;
    const {output} = await generate({
      model: gemini10Pro, // ✅ CORREÇÃO APLICADA AQUI
      prompt: prompt,
      output: {
        schema: GenerateCourseOutputSchema,
      },
    });
    if (!output) {
        throw new Error("A IA não conseguiu gerar o curso.");
    }
    return output;
  }
);