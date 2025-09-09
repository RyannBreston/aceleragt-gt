// src/app/api/sellers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Correção: Importação correta

// Schema de validação para atualização de vendedor
const updateSellerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  sales_value: z.number().min(0, "Valor de vendas deve ser positivo").optional(),
  ticket_average: z.number().min(0, "Ticket médio deve ser positivo").optional(),
  pa: z.number().min(0, "PA deve ser positivo").optional(),
  points: z.number().min(0, "Pontos devem ser positivos").optional(),
  role: z.enum(['seller', 'admin']).optional(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido para atualização" }
);

// Validação de UUID
const uuidSchema = z.string().uuid("ID deve ser um UUID válido");

// Função helper para lidar com erros do Prisma
function handlePrismaError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    switch ((error as { code: string }).code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 409 }
        );
      case 'P2025':
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

// GET - Obter um vendedor específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar UUID
    const validationResult = uuidSchema.safeParse(params.id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const seller = await prisma.seller.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    const { user, ...sellerData } = seller;
    const response = {
      ...sellerData,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Falha ao buscar vendedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um vendedor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar UUID
    const uuidValidation = uuidSchema.safeParse(params.id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: uuidValidation.error.errors },
        { status: 400 }
      );
    }

    // Validar corpo da requisição
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
        {
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, email, role, ...sellerData } = validationResult.data;

    const updatedSeller = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        seller: {
          update: sellerData,
        },
      },
      include: {
        seller: true,
      },
    });

    return NextResponse.json(updatedSeller);
  } catch (error) {
    return handlePrismaError(error);
  }
}

// DELETE - Deletar um vendedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar UUID
    const validationResult = uuidSchema.safeParse(params.id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePrismaError(error);
  }
}