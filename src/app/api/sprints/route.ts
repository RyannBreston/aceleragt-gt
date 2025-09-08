// src/app/api/sprints/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Rota para CRIAR (POST) uma nova sprint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Garante que o campo is_active não seja undefined
    const { title, description, goal, prize, start_date, end_date, is_active = false } = body;

    if (!title || !goal || !prize || !start_date || !end_date) {
        return new NextResponse('Dados incompletos para criar a sprint', { status: 400 });
    }

    const sprint = await db.dailySprint.create({
      data: {
        title,
        description,
        goal,
        prize,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_active,
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error("[SPRINTS_POST]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
