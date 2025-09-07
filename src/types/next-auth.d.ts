import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & NextAuth.DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}
