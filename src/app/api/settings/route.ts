// src/app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Input validation schema
const settingsSchema = z.object({
  sellers: z.array(z.object({
    id: z.string().uuid('ID inválido'),
    sales_value: z.number().min(0).optional(),
    ticket_average: z.number().min(0).optional(),
    pa: z.number().min(0).optional(),
    points: z.number().min(0).optional(),
  })),
  goals: z.record(z.unknown()).optional(),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);
    const { sellers, goals } = validatedData;

    if (!Array.isArray(sellers) || sellers.length === 0) {
      return NextResponse.json(
        { error: 'Lista de vendedores é obrigatória' },
        { status: 400 }
      );
    }

    // Use transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Update each seller
      for (const seller of sellers) {
        await tx.seller.update({
          where: { id: seller.id },
          data: {
            ...(seller.sales_value !== undefined && { sales_value: seller.sales_value }),
            ...(seller.ticket_average !== undefined && { ticket_average: seller.ticket_average }),
            ...(seller.pa !== undefined && { pa: seller.pa }),
            ...(seller.points !== undefined && { points: seller.points }),
          },
        });
      }

      // Update or create goals if provided
      if (goals) {
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
      }
    });

    return NextResponse.json({ 
      message: 'Configurações salvas com sucesso',
      success: true 
    });

  } catch (error) {
    console.error('API Settings PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao salvar as configurações' },
      { status: 500 }
    );
  }
}