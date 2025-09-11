// src/app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Busca todos os usuários com role 'seller' e inclui dados da tabela Seller
    const usersWithSeller = await prisma.user.findMany({
      where: { role: 'seller' },
      include: { seller: true },
    });

    // Formata a resposta para combinar os dados de User e Seller
    const sellers = usersWithSeller
      .filter(u => u.seller !== null)
      .map(u => ({
        id: u.id,
        name: u.name || '',
        email: u.email,
        sales_value: u.seller?.sales_value ?? 0,
        ticket_average: u.seller?.ticket_average ?? 0,
        pa: u.seller?.pa ?? 0,
        points: u.seller?.points ?? 0,
        extra_points: u.seller?.extra_points ?? 0,
        storeId: u.storeId || null,
        role: u.role as 'seller',
    }));

    // Busca os outros dados
    const [missions, sprints, goals] = await Promise.all([
      prisma.mission.findMany(),
      prisma.dailySprint.findMany(),
      prisma.goals.findFirst({ where: { id: 'main' } }),
    ]);

    return NextResponse.json({
      sellers,
      missions,
      sprints,
      goals,
    });
  } catch (error) {
    console.error("[ADMIN_DATA_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}