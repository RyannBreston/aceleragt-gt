'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
} from '@/lib/types';
import {generate} from '@genkit-ai/ai';
import {gemini10Pro} from '@genkit-ai/googleai';

export const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({topic, numQuestions}) => {
    const prompt = `Gere um quiz sobre "${topic}" com ${numQuestions} perguntas. Cada pergunta deve ter 4 opções, uma explicação para a resposta correta e o índice da resposta correta (de 0 a 3). O quiz deve ter um título geral.`;

    const {output} = await generate({
      model: gemini10Pro,
      prompt: prompt,
      output: {
        schema: GenerateQuizOutputSchema,
      },
      example: {
        title: 'Quiz sobre Vendas de Calçados',
        questions: [
          {
            question: 'Qual a melhor forma de abordar um cliente?',
            options: [
              'Esperar que ele fale primeiro',
              'Cumprimentar com simpatia e oferecer ajuda',
              'Perguntar imediatamente o que ele vai comprar',
              'Mostrar o produto mais caro da loja',
            ],
            correctAnswerIndex: 1,
            explanation:
              'Uma abordagem amigável e proativa cria uma boa primeira impressão e abre a porta para o diálogo.',
          },
        ],
      },
    });
    
    if (!output) {
        throw new Error("A IA não conseguiu gerar o quiz. Tente novamente.");
    }

    return output;
  }
);