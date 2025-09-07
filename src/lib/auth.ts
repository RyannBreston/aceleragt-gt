import { AuthOptions, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: NextAuthUser | null; }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error Role is a custom property we are adding to the token.
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT; }) {
      if (session?.user) {
        // @ts-expect-error We are adding the user id to the session.
        session.user.id = token.id;
        // @ts-expect-error Role is a custom property we are adding to the session.
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: []
};