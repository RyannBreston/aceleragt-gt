import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    
    // Garante que o role seja 'seller' se não for especificado
    const userRole = role || 'seller';

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole, 
      },
    });

    return NextResponse.json({ message: 'Usuário criado com sucesso.', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    // Evite expor detalhes do erro no cliente
    return NextResponse.json({ message: 'Erro interno ao registrar usuário.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
