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
        console.log("--- Authorize function started ---");
        if (!credentials || !credentials.email || !credentials.password) {
          console.log("Authorize failed: Missing credentials.");
          return null;
        }

        console.log(`Attempting to authorize user: ${credentials.email}`);

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log(`Authorize failed: User with email ${credentials.email} not found.`);
            return null;
          }

          console.log(`User found: ${user.name} (${user.email}). Checking password...`);

          if (!user.password) {
            console.log(`Authorize failed: User ${user.email} does not have a password set.`);
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

          if (isPasswordCorrect) {
            console.log("Password correct. Authorization successful.");
            return { id: user.id, name: user.name, email: user.email, role: user.role };
          }

          console.log("Authorize failed: Incorrect password.");
          return null;

        } catch (error) {
            console.error("Error during authorization process:", error);
            return null;
        }
      }
    })
  ]
};