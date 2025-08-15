'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export default function HistoryPage() {
  const { cycleHistory, isLoading } = useAdminContext();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <History className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Histórico de Ciclos</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ciclos Anteriores</CardTitle>
          <CardDescription>
            Consulte o desempenho dos vendedores em ciclos de vendas passados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycleHistory.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {cycleHistory.map((cycle) => (
                <AccordionItem value={cycle.id} key={cycle.id}>
                  <AccordionTrigger>
                    Ciclo Finalizado em{' '}
                    {format(cycle.endDate.toDate(), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendedor</TableHead>
                          <TableHead>Vendas</TableHead>
                          <TableHead>Ticket Médio</TableHead>
                          <TableHead>PA</TableHead>
                          <TableHead>Pontos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cycle.sellers.map((seller) => (
                          <TableRow key={seller.id}>
                            <TableCell>{seller.name}</TableCell>
                            <TableCell>
                              {(seller.salesValue || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </TableCell>
                            <TableCell>
                              {(seller.ticketAverage || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </TableCell>
                            <TableCell>{(seller.pa || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              {(seller.points || 0).toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">
                Nenhum histórico de ciclo disponível.
              </p>
              <p className="text-sm">
                O desempenho de ciclos anteriores aparecerá aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
