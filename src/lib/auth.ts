import { AuthOptions, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const generatedSecret = "a3b9f8e2c1d0a7b4e6f2c1d0a7b4e6f2c1d0a7b4e6f2c1d0a7b4e6f2c1d0a7b4";

export const authOptions: AuthOptions = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || generatedSecret,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: NextAuthUser | null; }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT; }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.password) {
          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
          if (isPasswordCorrect) {
            return { id: user.id, name: user.name, email: user.email, role: user.role };
          }
        }

        return null;
      }
    })
  ]
};