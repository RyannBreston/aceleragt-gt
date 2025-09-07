import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Busca o documento de metas principal
    const { rows } = await db.query("SELECT * FROM goals WHERE id = 'main' LIMIT 1");
    const goals = rows[0] || null; // Retorna o objeto de metas ou nulo

    return NextResponse.json(goals);
  } catch (error) {
    console.error('API Goals Error:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar as metas.' },
      { status: 500 }
    );
  }
}