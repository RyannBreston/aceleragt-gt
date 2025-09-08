// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Correção: Usa a instância compartilhada do Prisma
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'seller';

    // Correção Crítica: Criar User e Seller dentro de uma transação
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole,
        },
      });

      // Se o usuário é um vendedor, cria a entrada correspondente em Seller
      if (userRole === 'seller') {
        await tx.seller.create({
          data: {
            id: user.id, // Usa o mesmo ID do usuário
          },
        });
      }

      return user;
    });

    return NextResponse.json({ message: 'Usuário criado com sucesso.', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ message: 'Erro interno ao registrar usuário.' }, { status: 500 });
  }
}