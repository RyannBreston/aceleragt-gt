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
      return NextResponse.json({ message: 'O ID da corridinha é obrigatório.' }, { status: 400 });
    }

    const { rowCount } = await db.query('DELETE FROM daily_sprints WHERE id = $1', [id]);

    if (rowCount === 0) {
        return NextResponse.json({ message: 'Corridinha não encontrada.' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content para sucesso na exclusão
  } catch (error) {
    console.error('API Sprints DELETE Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir a corridinha.' }, { status: 500 });
  }
}