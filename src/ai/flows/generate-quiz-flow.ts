'use client';

import {ai} from '@/ai/genkit';
// ✅ CORREÇÃO APLICADA AQUI: O 'type GenerateQuizOutput' foi removido da importação
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
} from '@/lib/types';
import {generate} from '@genkit-ai/ai';
import {geminiPro} from 'genkitx-googleai';

export const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({topic, numQuestions}) => {
    const prompt = `Gere um quiz sobre "${topic}" com ${numQuestions} perguntas. Cada pergunta deve ter 4 opções, uma explicação para a resposta correta e o índice da resposta correta (de 0 a 3). O quiz deve ter um título geral.`;

    const {output} = await generate({
      model: geminiPro,
      prompt: prompt,
      output: {
        schema: GenerateQuizOutputSchema,
      },
      // Exemplo de como o output deve ser estruturado
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