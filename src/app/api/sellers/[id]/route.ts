import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// --- Atualizar Vendedor (PUT) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const id = params.id;
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ message: 'Nome e email são obrigatórios.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('API Sellers PUT Error:', error);
    // Adicionar verificação para erros específicos do Prisma, como registro não encontrado
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Vendedor não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro ao atualizar o vendedor.' }, { status: 500 });
  }
}

// --- Excluir Vendedor (DELETE) ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const id = params.id;

    // Usar uma transação para garantir que ambos os registros sejam removidos
    await prisma.$transaction(async (prisma) => {
        // O schema atual parece não ter uma tabela 'sellers' separada, 
        // o usuário com role 'seller' é o vendedor. Apenas apagamos o usuário.
        await prisma.user.delete({
            where: { id },
        });
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('API Sellers DELETE Error:', error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Vendedor não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro ao excluir o vendedor.' }, { status: 500 });
  }
}
