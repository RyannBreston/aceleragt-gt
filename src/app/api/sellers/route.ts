// src/app/api/sellers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Input validation schemas
const createSellerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const updateSellerSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  sales_value: z.number().min(0).optional(),
  ticket_average: z.number().min(0).optional(),
  pa: z.number().min(0).optional(),
  points: z.number().min(0).optional(),
  extra_points: z.number().min(0).optional(),
});

// Error handling helper
function handleError(error: unknown, defaultMessage: string) {
  console.error('API Error:', error);
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: error.errors },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

// GET - Buscar todos os vendedores
export async function GET() {
  try {
    const sellersFromDb = await prisma.seller.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    const sellers = sellersFromDb.map(s => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      role: s.user.role,
      sales_value: s.sales_value,
      ticket_average: s.ticket_average,
      pa: s.pa,
      points: s.points,
      extra_points: s.extra_points,
    }));

    return NextResponse.json(sellers);
  } catch (error) {
    return handleError(error, 'Erro ao buscar vendedores');
  }
}

// POST - Criar novo vendedor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSellerSchema.parse(body);
    const { name, email, password } = validatedData;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = uuidv4();

    // Transaction to create user and seller atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: newId,
          name,
          email,
          password: hashedPassword,
          role: 'seller',
        }
      });
      
      await tx.seller.create({
        data: {
          id: user.id,
        }
      });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    return handleError(error, 'Erro interno ao criar vendedor');
  }
}

// PUT - Atualizar vendedor
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
    const validatedData = updateSellerSchema.parse(body);
    const { id, name, email, sales_value, ticket_average, pa, points, extra_points } = validatedData;

    // Check if seller exists
    const existingSeller = await prisma.seller.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingSeller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Check email uniqueness if updating email
    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: id }
        },
        select: { id: true }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Este email já está em uso por outro usuário' },
          { status: 409 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update user data if provided
      if (name || email) {
        await tx.user.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(email && { email }),
          },
        });
      }

      // Update seller data
      await tx.seller.update({
        where: { id },
        data: {
          ...(sales_value !== undefined && { sales_value }),
          ...(ticket_average !== undefined && { ticket_average }),
          ...(pa !== undefined && { pa }),
          ...(points !== undefined && { points }),
          ...(extra_points !== undefined && { extra_points }),
        },
      });
    });

    return NextResponse.json({ message: 'Vendedor atualizado com sucesso' });

  } catch (error) {
    return handleError(error, 'Erro ao atualizar vendedor');
  }
}