import { prisma } from '@/lib/prisma';

export const getAdmin = async () => {
  // Implemente a lógica para buscar os dados do admin aqui.
  // Por enquanto, vamos retornar um objeto mock para evitar erros.
  // Você precisará ajustar isso para buscar o usuário logado real.
  const adminUser = await prisma.user.findFirst({
    // Adicione a condição para encontrar o admin. Ex:
    // where: { role: 'ADMIN' } 
  });
  return adminUser;
};
