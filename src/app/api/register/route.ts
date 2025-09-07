import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 });
    }

    // Verificar se o email já existe com Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário no banco de dados com Prisma
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin', // A página de signup cria um admin
      },
    });

    return NextResponse.json({ message: 'Administrador criado com sucesso.' }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ message: 'Erro ao registrar administrador.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
