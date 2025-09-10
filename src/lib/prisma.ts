import { PrismaClient } from '@prisma/client';
import { env } from '@/lib/env';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Optimized Prisma configuration for serverless environments (Vercel)
const createPrismaClient = () => {
  return new PrismaClient({
    // Optimize for serverless environments
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    // Connection pool settings for serverless
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Reduce connection timeout for serverless
    datasourceUrl: env.DATABASE_URL,
  });
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown for serverless
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
