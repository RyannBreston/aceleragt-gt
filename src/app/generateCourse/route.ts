import { NextResponse } from 'next/server';
import { generateCourse } from '@/ai/flows/generate-course-flow'; // Importa o seu fluxo de IA

// Esta função irá lidar com os pedidos POST para a nossa API
export async function POST(req: Request) { // CORREÇÃO: Tipando a requisição
  try {
    // Extrai o 'topic' do corpo do pedido
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'O tópico é obrigatório' }, { status: 400 });
    }

    // Chama o seu fluxo de IA de forma segura no lado do servidor
    const result = await generateCourse({ topic });

    // Retorna o resultado como JSON para o seu frontend
    return NextResponse.json(result);

  } catch (error: unknown) { // CORREÇÃO: Usando 'unknown' para o erro
    console.error("Erro na Rota de API generateCourse:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao gerar o curso";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
