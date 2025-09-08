// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declara uma variável no escopo global para armazenar a instância do PrismaClient.
// Isso evita que o hot-reloading do Next.js crie múltiplas instâncias em desenvolvimento.
declare global {
  var prisma: PrismaClient | undefined;
}

// Configuração do PrismaClient com opções otimizadas
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Cria a instância do Prisma, reutilizando a que já existe (global.prisma) em ambiente de desenvolvimento,
// ou criando uma nova em produção.
export const prisma = globalThis.prisma ?? createPrismaClient();

// Em ambiente de desenvolvimento, armazena a instância criada na variável global para
// que ela seja reutilizada nas próximas recargas.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown - desconecta do banco quando a aplicação é encerrada
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Exporta a instância para ser usada no restante do seu projeto.
export default prisma;

// Função helper para verificar conexão com o banco
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Função helper para executar queries com retry
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};