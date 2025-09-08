// src/app/api/sprints/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface IParams {
  id?: string;
}

// Rota para ATUALIZAR (PUT) uma sprint existente
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, goal, prize, start_date, end_date } = body;

    if (!id) {
      return new NextResponse('ID da sprint não encontrado', { status: 400 });
    }

    const sprint = await db.dailySprint.update({
      where: { id },
      data: {
        title,
        description,
        goal,
        prize,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    console.error("[SPRINT_PUT]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// Rota para DELETAR (DELETE) uma sprint
export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {
        const { id } = params;

        if (!id) {
            return new NextResponse('ID da sprint não encontrado', { status: 400 });
        }

        await db.dailySprint.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[SPRINT_DELETE]", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}
