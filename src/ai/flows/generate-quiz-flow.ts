'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  type GenerateQuizInput,
  type GenerateQuizOutput,
} from '@/lib/types';

export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `
Você é um coach de vendas criativo e exigente, especializado em calçados. Crie um QUIZ desafiador e diversificado com base no tema "{{topic}}".

- Gere EXATAMENTE {{numberOfQuestions}} perguntas.
- O nível de dificuldade é "{{difficulty}}". Adapte as perguntas e as opções de resposta para este nível.
- Use o identificador único de geração (seed): {{#if seed}}{{seed}}{{else}}geral{{/if}} para garantir a unicidade.

Regras RÍGIDAS:
1. Gere perguntas únicas e variadas com base no seed.
2. Evite repetir qualquer pergunta feita para outros vendedores no mesmo dia.
3. Não use estrutura semelhante entre as perguntas (ex: todas começando com "Qual é...").
4. Cubra áreas distintas do tema (ex: produto, abordagem, objeções, KPIs, psicologia do cliente, tendências de mercado).
5. Responda APENAS com JSON. Não inclua blocos de código ou explicações externas.

Instruções por Nível de Dificuldade:

**Nível "Fácil":**
- Perguntas devem ser diretas, focadas em conceitos básicos e fundamentais de vendas e produtos de calçados.
- As opções de resposta devem ter uma alternativa claramente correta e as demais devem ser obviamente incorretas ou distantes do tema.
- Exemplo: "Qual a principal função de um bom atendimento ao cliente?"

**Nível "Médio":**
- Perguntas devem exigir um pouco mais de raciocínio e aplicação de conceitos.
- Inclua cenários comuns do dia a dia de vendas de calçados.
- As opções de resposta devem ser mais plausíveis, exigindo um conhecimento mais aprofundado para identificar a correta.
- Exemplo: "Um cliente está indeciso entre dois modelos de tênis. Qual a melhor estratégia para ajudá-lo a decidir, focando em suas necessidades?"

**Nível "Difícil":**
- Perguntas devem ser complexas, envolvendo análise crítica, resolução de problemas e aplicação de estratégias avançadas.
- Inclua cenários desafiadores, objeções difíceis ou situações que exigem conhecimento de mercado e psicologia do consumidor.
- As opções de resposta devem ser muito próximas, exigindo um entendimento nuances e experiência prática para escolher a melhor.
- Exemplo: "Em um cenário de baixa sazonalidade, como um vendedor de calçados pode utilizar técnicas de cross-selling e up-selling para maximizar o ticket médio, sem parecer agressivo, e qual KPI seria mais impactado por essa estratégia?"

Formato da resposta:
{
  "title": "Quiz Exclusivo - Nível {{difficulty}}",
  "questions": [
    {
      "questionText": "Um cliente diz: 'Achei caro'. Qual a MELHOR resposta para contornar essa objeção sem dar desconto?",
      "options": [
        "Concordar e mostrar um mais barato",
        "Explicar que o preço é justo",
        "Perguntar 'Caro em relação a quê?' e focar no valor e benefícios do produto",
        "Dizer que a qualidade tem seu preço"
      ],
      "correctAnswerIndex": 2,
      "explanation": "Focar no valor (durabilidade, conforto, tecnologia) justifica o preço e desvia o foco do custo."
    }
  ]
}
`,
  config: {
    safetySettings: [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE'},
    ],
  },
});

const fallbackQuizzes: GenerateQuizOutput[] = [
  {
    title: 'Quiz de Técnicas de Venda - Básico',
    questions: [
      {
        questionText: 'Qual a melhor forma de abordar um cliente?',
        options: [
          'Esperar que ele fale primeiro',
          'Cumprimentar com simpatia e oferecer ajuda',
          'Segui-lo silenciosamente',
          'Falar das promoções imediatamente',
        ],
        correctAnswerIndex: 1,
        explanation: 'Uma abordagem simpática cria conexão e confiança.',
      },
      {
        questionText: 'O que caracteriza uma boa venda consultiva?',
        options: [
          'Oferecer o item mais caro',
          'Entender a necessidade do cliente',
          'Focar apenas na comissão',
          'Falar sobre todos os produtos da loja',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Na venda consultiva, você ajuda o cliente com a melhor solução.',
      },
    ],
  },
];

const getFallbackQuiz = (): GenerateQuizOutput => {
  const randomIndex = Math.floor(Math.random() * fallbackQuizzes.length);
  return fallbackQuizzes[randomIndex];
};

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    try {
      const response = await prompt(input);

      if (response.output) {
        if (response.output.questions.length === 0) {
          throw new Error('AI returned a valid structure but with no questions.');
        }
        return response.output;
      }

      const rawText = response.text || '';
      const jsonRegex = /```json\n([\s\S]*?)\n```|({[\s\S]*})/;
      const match = rawText.match(jsonRegex);
      const jsonString = match?.[1] || match?.[2];

      if (!jsonString) throw new Error('JSON inválido ou ausente na resposta da IA');

      const parsed = JSON.parse(jsonString);
      const validated = GenerateQuizOutputSchema.parse(parsed);

      if (validated.questions.length === 0) {
        throw new Error(
          'AI returned a valid structure but with no questions after parsing.'
        );
      }
      return validated;
    } catch (error) {
      console.warn('⚠️ Erro ao gerar quiz com a IA:', error);
      console.warn('📄 Retornando fallback local');
      return getFallbackQuiz();
    }
  }
);
