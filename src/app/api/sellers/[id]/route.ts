// src/app/api/sellers/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

interface IParams {
  id?: string;
}

// Rota para ATUALIZAR (PUT) um vendedor existente
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, password, team_id, sales_value, points } = body;

    if (!id) {
      return new NextResponse('ID do vendedor não encontrado', { status: 400 });
    }

    // Prepara os dados para atualização
    const updateData: any = {
        name,
        email,
        team_id,
        sales_value,
        points
    };

    // Se uma nova senha for fornecida, faz o hash dela
    if (password) {
        const hashedPassword = await hash(password, 12);
        updateData.password = hashedPassword;
    }

    const seller = await db.seller.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(seller);
  } catch (error) {
    console.error("[SELLER_PUT]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// Rota para DELETAR (DELETE) um vendedor
export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {
        const { id } = params;

        if (!id) {
            return new NextResponse('ID do vendedor não encontrado', { status: 400 });
        }

        await db.seller.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[SELLER_DELETE]", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}
