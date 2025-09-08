// src/app/api/sprints/[id]/toggle/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface IParams {
  id?: string;
}

// Rota para ATUALIZAR (PUT) o status de uma sprint (ativa/inativa)
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const { isActive } = await request.json();

    if (!id) {
      return new NextResponse('ID da sprint não encontrado', { status: 400 });
    }

    const sprint = await db.dailySprint.update({
      where: { id },
      data: {
        is_active: isActive,
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    console.error("[SPRINT_TOGGLE_PUT]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
