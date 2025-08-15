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
import { History, Award, Trophy, Star } from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { calculateSellerPrizes } from '@/lib/client-utils';

export default function HistoryPage() {
  const { cycleHistory, isAuthReady, currentSeller } = useSellerContext();

  if (!isAuthReady || !currentSeller) {
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
            Consulte o seu desempenho em ciclos de vendas passados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycleHistory.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {cycleHistory.map((cycle) => {
                 if (!cycle.sellers || !cycle.goals) return null;
                 const allSellersRanked = cycle.sellers
                     .map(s => calculateSellerPrizes(s, cycle.sellers, cycle.goals, null))
                     .sort((a, b) => b.totalPrize - a.totalPrize);
                 
                 const myData = allSellersRanked.find(s => s.id === currentSeller.id);
                 const myRank = allSellersRanked.findIndex(s => s.id === currentSeller.id) + 1;

                 if (!myData) return null;

                 return (
                    <AccordionItem value={cycle.id} key={cycle.id}>
                      <AccordionTrigger>
                        Ciclo Finalizado em{' '}
                        {format(cycle.endDate.toDate(), "dd 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-muted/50 rounded-lg"><h4 className="text-sm text-muted-foreground flex items-center gap-2"><Trophy/> Posição Final</h4><p className="text-xl font-bold">{myRank}º</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg"><h4 className="text-sm text-muted-foreground flex items-center gap-2"><Award/> Prémio Total</h4><p className="text-xl font-bold text-green-400">{myData.totalPrize.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                            <div className="p-4 bg-muted/50 rounded-lg"><h4 className="text-sm text-muted-foreground flex items-center gap-2"><Star/> Pontos Finais</h4><p className="text-xl font-bold">{myData.points.toLocaleString('pt-BR')}</p></div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                 )
              })}
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
