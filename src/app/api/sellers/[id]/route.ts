// src/app/api/sellers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Schema para atualização de vendedor
const updateSellerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  sales_value: z.number().min(0).optional(),
  ticket_average: z.number().min(0).optional(),
  pa: z.number().min(0).optional(),
  points: z.number().min(0).optional(),
  role: z.enum(['seller', 'admin']).optional(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido para atualização" }
);

// Validação de UUID
const uuidSchema = z.string().uuid("ID deve ser um UUID válido");

// Função para tratamento de erros do Prisma
function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }
  }
  console.error('Erro do Prisma:', error);
  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}

// GET - Buscar vendedor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validationResult = uuidSchema.safeParse(params.id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!user || !user.seller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    const { seller, ...userData } = user;
    return NextResponse.json({ ...userData, ...seller });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// PUT - Atualizar vendedor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uuidValidation = uuidSchema.safeParse(params.id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: uuidValidation.error.errors },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }

    const validationResult = updateSellerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, email, role, ...sellerData } = validationResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        seller: { update: sellerData }
      },
      include: { seller: true }
    });

    const { seller, ...userData } = updatedUser;
    return NextResponse.json({ ...userData, ...seller });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// DELETE - Remover vendedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validationResult = uuidSchema.safeParse(params.id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    return handlePrismaError(error);
  }
}