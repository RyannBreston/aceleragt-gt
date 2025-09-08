// src/app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Busca todos os sellers e inclui os dados do usuário relacionado (nome e email)
    const sellersWithUser = await prisma.seller.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Formata a resposta para combinar os dados do Seller e do User em um único objeto
    const sellers = sellersWithUser.map(s => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      sales_value: s.sales_value,
      ticket_average: s.ticket_average,
      pa: s.pa,
      points: s.points,
      extra_points: s.extra_points,
      team_id: s.team_id,
      // Mantém a compatibilidade com a interface User
      role: 'seller', 
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