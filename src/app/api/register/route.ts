import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

// Instale uuid: npm install uuid @types/uuid
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 });
    }

    // Verificar se o email já existe
    const { rows: existingUsers } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Inserir novo usuário no banco de dados
    await db.query(
      'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, hashedPassword, 'admin'] // A página de signup cria um admin
    );

    return NextResponse.json({ message: 'Administrador criado com sucesso.' }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ message: 'Erro ao registrar administrador.' }, { status: 500 });
  }
}