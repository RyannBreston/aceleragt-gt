import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const userId = context.params.id;
    const { newPassword } = await request.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          message:
            'O ID do utilizador e uma nova senha com pelo menos 6 caracteres são obrigatórios.',
        },
        { status: 400 }
      );
    }

    // Criptografar a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha na tabela 'users'
    const { rowCount } = await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Utilizador não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('API Change Password Error:', error);
    return NextResponse.json({ message: 'Erro ao alterar a senha.' }, { status: 500 });
  }
}
