// src/app/api/sellers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

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
function handlePrismaError(error: any) {
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
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sales_value: true,
        ticket_average: true,
        pa: true,
        points: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        // Não incluir campos sensíveis como password hash
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(seller);
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

    // Verificar se o vendedor existe antes de atualizar
    const existingSeller = await prisma.seller.findUnique({
      where: { id: params.id },
    });

    if (!existingSeller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar vendedor
    const updatedSeller = await prisma.seller.update({
      where: { id: params.id },
      data: {
        ...validationResult.data,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sales_value: true,
        ticket_average: true,
        pa: true,
        points: true,
        role: true,
        is_active: true,
        updated_at: true,
      },
    });

    return NextResponse.json(updatedSeller);
  } catch (error: any) {
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

    // Verificar se o vendedor existe
    const existingSeller = await prisma.seller.findUnique({
      where: { id: params.id },
    });

    if (!existingSeller) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Soft delete ao invés de hard delete (opcional)
    const isHardDelete = request.nextUrl.searchParams.get('hard') === 'true';
    
    if (isHardDelete) {
      // Hard delete - remove completamente
      await prisma.seller.delete({
        where: { id: params.id },
      });
    } else {
      // Soft delete - apenas marca como inativo
      await prisma.seller.update({
        where: { id: params.id },
        data: { 
          is_active: false,
          updated_at: new Date(),
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return handlePrismaError(error);
  }
}

// PATCH - Atualização parcial (alternativa ao PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Reutilizar lógica do PUT para PATCH
  return PUT(request, { params });
}