'use client';

import * as React from 'react';
import { ShoppingBag, Loader2, Star } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import type { PrizeItem } from '@/lib/types';
import { useSellerContext } from '@/app/seller/layout';

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatPoints = (value: number) => {
    return `${value.toLocaleString('pt-BR')} pts`;
};

export default function SellerLojaPage() {
  const { toast } = useToast();
  const { currentSeller } = useSellerContext();
  const [prizes, setPrizes] = React.useState<PrizeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const prizesCollectionPath = `artifacts/${appId}/public/data/prizes`;

  React.useEffect(() => {
    const prizesQuery = query(collection(db, prizesCollectionPath), orderBy('points', 'asc'));
    const unsubscribe = onSnapshot(prizesQuery, (snapshot) => {
      const prizesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrizeItem));
      setPrizes(prizesList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar prémios:", error);
      toast({ variant: 'destructive', title: 'Erro ao Carregar Prémios', description: "Não foi possível buscar os prémios." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [prizesCollectionPath, toast]);
  
  const handleRedeem = (prize: PrizeItem) => {
      // Futuramente, a lógica de resgate será implementada aqui.
      // Por agora, apenas exibimos um alerta.
      alert(`Funcionalidade de resgate para "${prize.name}" ainda não implementada.`);
  }

  const totalPoints = (currentSeller?.points || 0) + (currentSeller?.extraPoints || 0);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">A carregar prémios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <ShoppingBag className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">Loja de Prémios</h1>
        </div>
        <Card className="p-3 bg-card border-border/50">
            <div className="flex items-center gap-2">
                <Star className="size-5 text-yellow-400" />
                <span className="text-lg font-bold">{totalPoints.toLocaleString('pt-BR')}</span>
                <span className="text-sm text-muted-foreground">Pontos Disponíveis</span>
            </div>
        </Card>
      </div>

      {prizes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prizes.map(prize => {
            const canAfford = totalPoints >= prize.points;
            return (
              <Card key={prize.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="p-0">
                  <img src={prize.imageUrl || 'https://placehold.co/600x400/27272a/FFF?text=Prêmio'} alt={prize.name} className="w-full h-48 object-cover" />
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <CardTitle className="text-lg mb-2 flex-grow">{prize.name}</CardTitle>
                  {prize.description && <CardDescription className="text-xs mb-4">{prize.description}</CardDescription>}
                  
                   <div className="mt-auto">
                     <Badge variant="secondary" className="text-base font-bold text-primary border-primary/50 border-2">
                        {formatPoints(prize.points)}
                    </Badge>
                   </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/50">
                    <Button onClick={() => handleRedeem(prize)} disabled={!canAfford} className="w-full font-bold">
                        {canAfford ? 'Resgatar' : 'Pontos Insuficientes'}
                    </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
                <ShoppingBag className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum prémio disponível no momento.</h3>
                <p className="mt-1 text-sm">Verifique novamente mais tarde.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}