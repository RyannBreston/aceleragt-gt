import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, participant_ids, sprint_tiers } = body;

    if (!title || !participant_ids || !sprint_tiers) {
        return new NextResponse('Dados incompletos para criar a sprint', { status: 400 });
    }

    const sprint = await prisma.dailySprint.create({
      data: {
        title,
        description,
        participant_ids,
        sprint_tiers,
        is_active: false, // Sprints começam inativas por padrão
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error("[SPRINTS_POST]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}