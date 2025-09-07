'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Seller } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SalesTableProps {
  sellers: Seller[];
}

export default function SalesTable({ sellers }: SalesTableProps) {
  const rankedSellers = [...sellers]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendedor</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Vendas</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankedSellers.map((seller) => (
          <TableRow key={seller.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{seller.name}</div>
              </div>
            </TableCell>
            <TableCell>{seller.email}</TableCell>
            <TableCell className="text-right">{formatCurrency(seller.sales_value || 0)}</TableCell>
            <TableCell className="text-right">
                <Badge variant="secondary">{seller.points || 0}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}