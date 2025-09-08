// src/app/api/missions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Rota para CRIAR (POST) uma nova missão
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, goal, prize } = body;

    if (!title || !goal || !prize) {
        return new NextResponse('Dados incompletos para criar a missão', { status: 400 });
    }

    const mission = await db.mission.create({
      data: {
        title,
        description,
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

// Rota para LER (GET) todas as missões
export async function GET() {
    try {
        const missions = await db.mission.findMany({
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
