import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Função para obter todas as Missões
export async function GET() {
  try {
    const { rows: missions } = await db.query('SELECT * FROM missions ORDER BY points ASC');
    return NextResponse.json(missions);
  } catch (error) {
    console.error('API Missions GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar as missões.' }, { status: 500 });
  }
}

// Função para criar uma nova Missão
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { title, description, points, type, goal, course_id } = await request.json();
    const newId = uuidv4();

    if (!title || points === undefined) {
        return NextResponse.json({ message: 'Título e pontos são obrigatórios.' }, { status: 400 });
    }

    const query = `
      INSERT INTO missions (id, title, description, points, type, goal, course_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [newId, title, description, points, type, goal, course_id];
    const { rows } = await db.query(query, values);

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('API Missions POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar a missão.' }, { status: 500 });
  }
}

// Função para atualizar uma Missão
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { id, title, description, points, type, goal, course_id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'O ID da missão é obrigatório.' }, { status: 400 });
    }

    const query = `
      UPDATE missions
      SET title = $1, description = $2, points = $3, type = $4, goal = $5, course_id = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [title, description, points, type, goal, course_id, id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
        return NextResponse.json({ message: 'Missão não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('API Missions PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar a missão.' }, { status: 500 });
  }
}