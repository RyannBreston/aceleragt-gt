import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const goals = await prisma.goals.findUnique({
      where: { id: 'main' },
    });
    return NextResponse.json(goals || null);
  } catch (error) {
    console.error('API Goals GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar as metas.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const updatedGoals = await prisma.goals.upsert({
      where: { id: 'main' },
      update: {
        data: body.data, // Assume que os dados complexos estão em um campo 'data'
        monthly_goal: body.monthly_goal,
        pa_goal: body.pa_goal,
        ticket_goal: body.ticket_goal,
      },
      create: {
        id: 'main',
        data: body.data,
        monthly_goal: body.monthly_goal,
        pa_goal: body.pa_goal,
        ticket_goal: body.ticket_goal,
      },
    });

    return NextResponse.json(updatedGoals);
  } catch (error) {
    console.error('API Goals PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar as metas.' }, { status: 500 });
  }
}