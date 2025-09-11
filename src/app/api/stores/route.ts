// filepath: src/app/api/stores/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// GET: lista todas as lojas
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('API Stores GET Error:', error);
    return NextResponse.json({ message: 'Erro ao listar lojas.' }, { status: 500 });
  }
}

// POST: cria uma nova loja
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { name, ownerId, memberIds } = await request.json();
    if (!name || !ownerId) {
      return NextResponse.json({ message: 'Nome da loja e administrador são obrigatórios.' }, { status: 400 });
    }

    const newStore = await prisma.store.create({
      data: {
        name,
        owner: { connect: { id: ownerId } },
        members: memberIds ? { connect: memberIds.map(id => ({ id })) } : undefined
      }
    });
    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error('API Stores POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar loja.' }, { status: 500 });
  }
}
