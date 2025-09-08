// src/app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [sellers, missions, sprints, goals] = await Promise.all([
      db.seller.findMany({ include: { sales: true } }),
      db.mission.findMany(),
      db.dailySprint.findMany(),
      db.goal.findFirst(), // Assuming you have a single goal document/record
    ]);

    // Processar os dados se necessário, por exemplo, calcular o valor total de vendas por vendedor
    const sellersWithSalesValue = sellers.map(seller => ({
      ...seller,
      sales_value: seller.sales.reduce((acc, sale) => acc + sale.value, 0),
    }));

    return NextResponse.json({ 
      sellers: sellersWithSalesValue,
      missions,
      sprints,
      goals,
    });
  } catch (error) {
    console.error("[ADMIN_DATA_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
