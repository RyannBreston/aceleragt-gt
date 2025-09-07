import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função GET (já existente)
export async function GET() {
  try {
    const { rows } = await db.query("SELECT * FROM goals WHERE id = 'main' LIMIT 1");
    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error('API Goals GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar as metas.' }, { status: 500 });
  }
}

// Função PUT para atualizar as Metas
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { monthly_goal, pa_goal, ticket_goal } = await request.json();

    if (monthly_goal === undefined || pa_goal === undefined || ticket_goal === undefined) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // "UPSERT": Tenta atualizar. Se a linha 'main' não existir, insere-a.
    const query = `
      INSERT INTO goals (id, monthly_goal, pa_goal, ticket_goal)
      VALUES ('main', $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        monthly_goal = EXCLUDED.monthly_goal,
        pa_goal = EXCLUDED.pa_goal,
        ticket_goal = EXCLUDED.ticket_goal,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [monthly_goal, pa_goal, ticket_goal];
    const { rows } = await db.query(query, values);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('API Goals PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar as metas.' }, { status: 500 });
  }
}