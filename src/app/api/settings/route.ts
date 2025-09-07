import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  const client = await db.getClient(); // Obtém um cliente do pool para a transação

  try {
    const { sellers, goals } = await request.json();

    if (!Array.isArray(sellers) || !goals) {
      return NextResponse.json({ message: 'Dados de vendedores e metas são obrigatórios.' }, { status: 400 });
    }

    // Iniciar a transação
    await client.query('BEGIN');
    
    // 1. Atualizar cada vendedor num loop
    for (const seller of sellers) {
      const sellerQuery = `
        UPDATE sellers
        SET sales_value = $1, ticket_average = $2, pa = $3, points = $4
        WHERE id = $5;
      `;
      await client.query(sellerQuery, [
        seller.salesValue,
        seller.ticketAverage,
        seller.pa,
        seller.points,
        seller.id,
      ]);
    }

    // 2. Atualizar as metas (UPSERT)
    const goalsQuery = `
      INSERT INTO goals (id, data)
      VALUES ('main', $1)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(goalsQuery, [goals]);

    // Confirmar a transação
    await client.query('COMMIT');

    return NextResponse.json({ message: 'Configurações salvas com sucesso.' });

  } catch (error) {
    // Se ocorrer qualquer erro, reverte a transação
    await client.query('ROLLBACK');
    console.error('API Settings PUT Error:', error);
    return NextResponse.json({ message: 'Erro interno ao salvar as configurações.' }, { status: 500 });
  } finally {
    // Liberta o cliente de volta para o pool, independentemente do resultado
    client.release();
  }
}