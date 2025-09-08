// src/app/api/missions/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface IParams {
  id?: string;
}

// Rota para ATUALIZAR (PUT) uma missão existente
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, goal, prize } = body;

    if (!id) {
      return new NextResponse('ID da missão não encontrado', { status: 400 });
    }

    const mission = await db.mission.update({
      where: { id },
      data: {
        title,
        description,
        goal,
        prize,
      },
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error("[MISSION_PUT]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// Rota para DELETAR (DELETE) uma missão
export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {
        const { id } = params;

        if (!id) {
            return new NextResponse('ID da missão não encontrado', { status: 400 });
        }

        await db.mission.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[MISSION_DELETE]", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}
