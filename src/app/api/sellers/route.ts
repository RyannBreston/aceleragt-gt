import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Função GET (já existente)
export async function GET() {
  try {
    const { rows: sellers } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, s.sales_value, s.ticket_average, s.pa, s.points, s.extra_points
       FROM users u
       JOIN sellers s ON u.id = s.id
       WHERE u.role = 'seller'`
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

  try {
    const { name, email, password } = await request.json();

    // Validação básica
    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ message: 'Dados inválidos. Nome, e-mail e uma senha com pelo menos 6 caracteres são obrigatórios.' }, { status: 400 });
    }

    // Verificar se o e-mail já existe
    const { rows: existingUsers } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = uuidv4();

    // Usar uma transação para garantir que ambas as inserções funcionem ou falhem juntas
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      // Inserir na tabela 'users'
      await client.query(
        'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        [newId, name, email, hashedPassword, 'seller']
      );
      // Inserir na tabela 'sellers'
      await client.query(
        'INSERT INTO sellers (id) VALUES ($1)',
        [newId]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ id: newId, name, email, role: 'seller' }, { status: 201 });

  } catch (error) {
    console.error('API Sellers POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar o vendedor.' }, { status: 500 });
  }
}

// Função PUT para atualizar um Vendedor
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
    }

    try {
        const { id, name, email, sales_value, ticket_average, pa, points, extra_points } = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'O ID do vendedor é obrigatório.' }, { status: 400 });
        }
        
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            // Atualizar a tabela 'users'
            await client.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, id]);
            // Atualizar a tabela 'sellers'
            await client.query(
                `UPDATE sellers 
                 SET sales_value = $1, ticket_average = $2, pa = $3, points = $4, extra_points = $5
                 WHERE id = $6`,
                [sales_value, ticket_average, pa, points, extra_points, id]
            );
            await client.query('COMMIT');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ message: 'Vendedor atualizado com sucesso.' });

    } catch (error) {
        console.error('API Sellers PUT Error:', error);
        return NextResponse.json({ message: 'Erro ao atualizar o vendedor.' }, { status: 500 });
    }
}