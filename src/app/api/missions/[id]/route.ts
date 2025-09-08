import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface IParams {
  id?: string;
}

export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, points, goal, prize } = body;

    if (!id) {
      return new NextResponse('ID da missão não encontrado', { status: 400 });
    }

    const mission = await prisma.mission.update({
      where: { id },
      data: {
        title,
        description,
        points,
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

export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse('ID da missão não encontrado', { status: 400 });
    }
    await prisma.mission.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MISSION_DELETE]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}