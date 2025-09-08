// src/app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const { sellers, goals } = await request.json();

    if (!Array.isArray(sellers) || !goals) {
      return NextResponse.json({ message: 'Dados de vendedores e metas são obrigatórios.' }, { status: 400 });
    }

    // Utiliza uma transação do Prisma para garantir a consistência dos dados
    await prisma.$transaction(async (tx) => {
      // 1. Atualiza cada vendedor em um loop
      for (const seller of sellers) {
        await tx.seller.update({
          where: { id: seller.id },
          data: {
            sales_value: seller.sales_value,
            ticket_average: seller.ticket_average,
            pa: seller.pa,
            points: seller.points,
          },
        });
      }

      // 2. Atualiza (ou cria, se não existir) o registro de metas
      await tx.goals.upsert({
        where: { id: 'main' },
        update: {
          data: goals,
        },
        create: {
          id: 'main',
          data: goals,
        },
      });
    });

    return NextResponse.json({ message: 'Configurações salvas com sucesso.' });

  } catch (error) {
    console.error('API Settings PUT Error:', error);
    return NextResponse.json({ message: 'Erro interno ao salvar as configurações.' }, { status: 500 });
  }
}