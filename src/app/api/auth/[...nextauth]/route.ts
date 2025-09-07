import NextAuth, { AuthOptions, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
// ...

export const authOptions: AuthOptions = {
  // ...
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: NextAuthUser | null; }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // 'any' aqui é difícil de evitar sem type augmentation
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT; }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: []
};
// ...