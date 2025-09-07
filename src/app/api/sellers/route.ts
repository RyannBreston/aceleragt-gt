import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Função GET para buscar todos os Vendedores
// Corrigido: parâmetro 'request' removido pois não é utilizado.
export async function GET() {
  try {
    const { rows: sellers } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, s.sales_value, s.ticket_average, s.pa, s.points, s.extra_points
       FROM users u
       JOIN sellers s ON u.id = s.id
       WHERE u.role = 'seller'
       ORDER BY u.name ASC`
    );
    return NextResponse.json(sellers);
  } catch (error) {
    console.error('API Sellers GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar vendedores.' }, { status: 500 });
  }
}

// Função POST para criar um novo Vendedor
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  const client = await db.getClient();

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ message: 'Dados inválidos. Nome, e-mail e uma senha com pelo menos 6 caracteres são obrigatórios.' }, { status: 400 });
    }

    const { rows: existingUsers } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = uuidv4();

    await client.query('BEGIN');
    
    const userQuery = 'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)';
    await client.query(userQuery, [newId, name, email, hashedPassword, 'seller']);
    
    const sellerQuery = 'INSERT INTO sellers (id) VALUES ($1)';
    await client.query(sellerQuery, [newId]);
    
    await client.query('COMMIT');

    return NextResponse.json({ id: newId, name, email, role: 'seller' }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('API Sellers POST Error:', error);
    return NextResponse.json({ message: 'Erro interno ao criar o vendedor.' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Função PUT para atualizar um Vendedor
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
    }

    const client = await db.getClient();

    try {
        const { id, name, email, sales_value, ticket_average, pa, points, extra_points } = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'O ID do vendedor é obrigatório.' }, { status: 400 });
        }
        
        await client.query('BEGIN');
        
        await client.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, id]);
        
        await client.query(
            `UPDATE sellers 
             SET sales_value = $1, ticket_average = $2, pa = $3, points = $4, extra_points = $5
             WHERE id = $6`,
            [sales_value || 0, ticket_average || 0, pa || 0, points || 0, extra_points || 0, id]
        );
        
        await client.query('COMMIT');

        return NextResponse.json({ message: 'Vendedor atualizado com sucesso.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Sellers PUT Error:', error);
        return NextResponse.json({ message: 'Erro ao atualizar o vendedor.' }, { status: 500 });
    } finally {
        client.release();
    }
}