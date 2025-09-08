import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface IParams {
  id?: string;
}

export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const { isActive } = await request.json();

    if (!id) {
      return new NextResponse('ID da sprint não encontrado', { status: 400 });
    }

    const sprint = await prisma.dailySprint.update({
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