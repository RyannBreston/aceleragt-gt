'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Loader2 } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/EmptyState';
import type { Seller } from '@/lib/types';

const VendedoresTable = ({ sellers }: { sellers: Seller[] }) => (
  <div className="rounded-md border my-4">
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
        {sellers.map(seller => (
          <TableRow key={seller.id}>
            <TableCell className="font-medium">{seller.name}</TableCell>
            <TableCell>{(seller.salesValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
            <TableCell>{(seller.ticketAverage || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
            <TableCell>{(seller.pa || 0).toFixed(2)}</TableCell>
            <TableCell>{((seller.points || 0) + (seller.extraPoints || 0)).toLocaleString('pt-BR')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function HistoryPage() {
    const { cycleHistory, isAuthReady } = useAdminContext();

    const sortedHistory = useMemo(() => {
        return [...cycleHistory].sort((a, b) => b.endDate.seconds - a.endDate.seconds);
    }, [cycleHistory]);

    const renderContent = () => {
        if (!isAuthReady) {
            return <EmptyState Icon={Loader2} title="A carregar histórico..." description="Aguarde um momento." className="animate-spin"/>
        }
        if (sortedHistory.length === 0) {
            return <EmptyState Icon={History} title="Nenhum ciclo finalizado" description="O histórico de ciclos aparecerá aqui assim que finalizar o primeiro."/>
        }
        return (
            <Accordion type="single" collapsible className="w-full">
                {sortedHistory.map(cycle => (
                    <AccordionItem value={cycle.id} key={cycle.id}>
                        <AccordionTrigger>
                            <div className='flex justify-between w-full pr-4'>
                                <span>Ciclo de {format(cycle.endDate.seconds * 1000, "MMMM 'de' yyyy", { locale: ptBR })}</span>
                                <span className='text-sm text-muted-foreground'>Finalizado em {format(cycle.endDate.seconds * 1000, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <h4 className="font-semibold text-lg mb-2">Resumo do Desempenho</h4>
                            <VendedoresTable sellers={cycle.sellers} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <History className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Histórico de Ciclos</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Ciclos Finalizados</CardTitle>
                    <CardDescription>Consulte o desempenho dos vendedores em ciclos anteriores.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
