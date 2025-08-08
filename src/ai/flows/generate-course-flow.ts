'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateCourseInputSchema,
  GenerateCourseOutputSchema,
} from '@/lib/types';
import {gemini10Pro} from '@genkit-ai/googleai';

// Definição do Prompt de forma explícita
const coursePrompt = ai.definePrompt(
  {
    name: 'coursePrompt',
    input: {schema: GenerateCourseInputSchema},
    output: {schema: GenerateCourseOutputSchema},
    prompt: `Gere um curso sobre "{{topic}}". O curso deve ter um título criativo, conteúdo em Markdown e um quiz com pelo menos 3 perguntas.`,
  }
);

export const generateCourse = ai.defineFlow(
  {
    name: 'generateCourseFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: GenerateCourseOutputSchema,
  },
  async ({topic}) => {
    // Chamada usando o prompt definido
    const {output} = await coursePrompt({topic});
    
    if (!output) {
        throw new Error("A IA não conseguiu gerar o curso.");
    }
    return output;
  }
);