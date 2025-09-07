import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ message: 'O ID da missão é obrigatório.' }, { status: 400 });
    }

    const { rowCount } = await db.query('DELETE FROM missions WHERE id = $1', [id]);

    if (rowCount === 0) {
        return NextResponse.json({ message: 'Missão não encontrada.' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // Sucesso
  } catch (error) {
    console.error('API Missions DELETE Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir a missão.' }, { status: 500 });
  }
}