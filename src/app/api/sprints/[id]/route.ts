import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface IParams {
  id?: string;
}

export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, participant_ids, sprint_tiers } = body;

    if (!id) {
      return new NextResponse('ID da sprint não encontrado', { status: 400 });
    }

    const sprint = await prisma.dailySprint.update({
      where: { id },
      data: {
        title,
        participant_ids,
        sprint_tiers,
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    console.error("[SPRINT_PUT]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {
        const { id } = params;
        if (!id) {
            return new NextResponse('ID da sprint não encontrado', { status: 400 });
        }
        await prisma.dailySprint.delete({
            where: { id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SPRINT_DELETE]", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}