import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json({ message: 'O ID do vendedor é obrigatório.' }, { status: 400 });
    }

    // Devido à chave estrangeira, precisamos de apagar primeiro da tabela 'sellers'
    // e depois da tabela 'users'. Uma transação garante a consistência.
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM sellers WHERE id = $1', [id]);
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return new NextResponse(null, { status: 204 }); // Sucesso sem conteúdo
  } catch (error) {
    console.error('API Sellers DELETE Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir o vendedor.' }, { status: 500 });
  }
}
