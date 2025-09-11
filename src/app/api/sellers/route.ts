// src/app/api/sellers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Correção: Usando Prisma
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Função GET para buscar todos os Vendedores
export async function GET() {
  try {
    const sellersFromDb = await prisma.seller.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            storeId: true,
          },
        },
      },
      orderBy: {
        user: { name: 'asc' },
      },
    });

    const sellers = sellersFromDb.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      role: s.user.role,
      sales_value: s.sales_value,
      ticket_average: s.ticket_average,
      pa: s.pa,
      points: s.points,
      extra_points: s.extra_points,
      storeId: s.user.storeId || null,
    }));

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
    const { name, email, password, storeId } = await request.json();

    if (!name || !email || !password || password.length < 6 || !storeId) {
      return NextResponse.json({ message: 'Dados inválidos. Nome, e-mail, senha (≥6) e loja são obrigatórios.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = uuidv4();

    // Transação para criar User e Seller juntos
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: newId,
          name,
          email,
          password: hashedPassword,
          role: 'seller',
          storeId,
        },
      });
      await tx.seller.create({ data: { id: user.id } });
    });

    return NextResponse.json({ id: newId, name, email, role: 'seller', storeId }, { status: 201 });

  } catch (error) {
    console.error('API Sellers POST Error:', error);
    return NextResponse.json({ message: 'Erro interno ao criar o vendedor.' }, { status: 500 });
  }
}

// Função PUT para atualizar um Vendedor
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
    }

    try {
        const { id, name, email, storeId, sales_value, ticket_average, pa, points, extra_points } = await request.json();

        if (!id || !storeId) {
            return NextResponse.json({ message: 'ID e loja são obrigatórios.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id },
            data: {
              name,
              email,
              storeId,
            },
          });
          await tx.seller.update({
            where: { id },
            data: {
              sales_value: sales_value || 0,
              ticket_average: ticket_average || 0,
              pa: pa || 0,
              points: points || 0,
              extra_points: extra_points || 0,
            },
          });
        });

        return NextResponse.json({ message: 'Vendedor atualizado com sucesso.' });

    } catch (error) {
        console.error('API Sellers PUT Error:', error);
        return NextResponse.json({ message: 'Erro ao atualizar o vendedor.' }, { status: 500 });
    }
}