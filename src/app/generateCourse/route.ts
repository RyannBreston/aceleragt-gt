import { NextRequest, NextResponse } from 'next/server';
import { generateCourse } from '@/ai/flows/generate-course-flow'; // Importa o seu fluxo de IA

// Esta função irá lidar com os pedidos POST para a nossa API
export async function POST(req: NextRequest) {
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

  } catch (error: any) {
    console.error("Erro na Rota de API generateCourse:", error);
    return NextResponse.json({ error: 'Falha ao gerar o curso' }, { status: 500 });
  }
}