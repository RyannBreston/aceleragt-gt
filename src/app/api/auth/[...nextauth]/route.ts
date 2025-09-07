import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { User } from 'next-auth';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          // 1. Encontrar o usuário no banco de dados Neon pelo email
          const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = rows[0];

          if (!user) {
            // Usuário não encontrado
            return null;
          }

          // 2. Verificar se a senha está correta usando bcrypt
          // Precisaremos de uma coluna 'password' na tabela 'users'
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            // Senha incorreta
            return null;
          }

          // 3. Se tudo estiver correto, retorna os dados do usuário para a sessão
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as User;

        } catch (error) {
          console.error('Authorize Error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    // Adiciona a role e o id ao token JWT
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Adiciona a role e o id à sessão do cliente
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redireciona para a página de login se não estiver autenticado
  },
  secret: process.env.NEXTAUTH_SECRET, // Chave secreta para assinar os JWTs
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };