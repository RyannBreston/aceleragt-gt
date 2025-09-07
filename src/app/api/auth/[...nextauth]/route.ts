import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Assuming authOptions are in a separate file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };