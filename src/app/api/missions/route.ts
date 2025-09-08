import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, points, goal, prize } = body;

    if (!title || !points) {
      return new NextResponse('Dados incompletos para criar a missão', { status: 400 });
    }

    const mission = await prisma.mission.create({
      data: {
        title,
        description,
        points,
        goal,
        prize,
      },
    });

    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    console.error("[MISSIONS_POST]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function GET() {
  try {
    const missions = await prisma.mission.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(missions);
  } catch (error) {
    console.error("[MISSIONS_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}