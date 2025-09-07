import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função para obter todas as Sprints (já existente)
export async function GET() {
  try {
    const { rows: sprints } = await db.query('SELECT * FROM daily_sprints ORDER BY created_at DESC');
    return NextResponse.json(sprints);
  } catch (error) {
    console.error('API Sprints GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar as corridinhas.' }, { status: 500 });
  }
}

// Função para criar uma nova Sprint
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { title, sprintTiers, participantIds } = await request.json();
    const newId = uuidv4();

    // A coluna sprint_tiers é do tipo JSONB, então podemos passar o objeto diretamente
    const query = `
      INSERT INTO daily_sprints (id, title, sprint_tiers, participant_ids, is_active)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING *;
    `;
    const values = [newId, title, sprintTiers, participantIds];

    const { rows } = await db.query(query, values);

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('API Sprints POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar a corridinha.' }, { status: 500 });
  }
}

// Função para atualizar uma Sprint existente
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { id, title, sprintTiers, participantIds, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'O ID da corridinha é obrigatório.' }, { status: 400 });
    }

    const query = `
      UPDATE daily_sprints
      SET 
        title = $1,
        sprint_tiers = $2,
        participant_ids = $3,
        is_active = $4
      WHERE id = $5
      RETURNING *;
    `;
    const values = [title, sprintTiers, participantIds, isActive, id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Corridinha não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('API Sprints PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar a corridinha.' }, { status: 500 });
  }
}