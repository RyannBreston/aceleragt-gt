import { AuthOptions, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
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
        // TODO: Implement user authentication logic here.
        // This is just a placeholder.
        if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
          return { id: "1", name: "Admin", email: "admin@example.com", role: "admin" };
        }
        if (credentials?.email === "seller@example.com" && credentials?.password === "password") {
          return { id: "2", name: "Seller", email: "seller@example.com", role: "seller" };
        }
        return null;
      }
    })
  ]
};