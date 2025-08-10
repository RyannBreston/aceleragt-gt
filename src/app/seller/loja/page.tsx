'use client';

import * as React from 'react';
import Image from 'next/image';
import { ShoppingBag, Loader2, Star } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, increment, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import type { PrizeItem } from '@/lib/types';
import { useSellerContext } from '@/contexts/SellerContext';
import { EmptyState } from '@/components/EmptyState'; // Importa o novo componente

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatPoints = (value: number) => {
    return `${value.toLocaleString('pt-BR')} pts`;
};

export default function SellerLojaPage() {
  const { toast } = useToast();
  const { currentSeller, setSellers } = useSellerContext();
  const [prizes, setPrizes] = React.useState<PrizeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [redeemingId, setRedeemingId] = React.useState<string | null>(null);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
  const prizesCollectionPath = `artifacts/${appId}/public/data/prizes`;

  React.useEffect(() => {
    const prizesQuery = query(collection(db, prizesCollectionPath), orderBy('points', 'asc'));
    const unsubscribe = onSnapshot(prizesQuery, (snapshot) => {
      const prizesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrizeItem));
      setPrizes(prizesList);
      setLoading(false);
    }, () => {
      toast({ variant: 'destructive', title: 'Erro ao Carregar Prémios', description: "Não foi possível buscar os prémios." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [prizesCollectionPath, toast]);
  
  const handleRedeem = async (prize: PrizeItem) => {
      if (!currentSeller) return;

      const totalPoints = (currentSeller.points || 0) + (currentSeller.extraPoints || 0);
      if (totalPoints < prize.points) {
          toast({ variant: 'destructive', title: 'Pontos Insuficientes!' });
          return;
      }
      
      setRedeemingId(prize.id);

      try {
        await runTransaction(db, async (transaction) => {
            const sellerRef = doc(db, 'sellers', currentSeller.id);
            const prizeRef = doc(db, prizesCollectionPath, prize.id);

            const sellerDoc = await transaction.get(sellerRef);
            if (!sellerDoc.exists()) throw new Error("Vendedor não encontrado.");
            
            const currentPoints = (sellerDoc.data().points || 0);
            if (currentPoints < prize.points) throw new Error("Pontos insuficientes.");

            transaction.update(sellerRef, { points: increment(-prize.points) });

            if (typeof prize.stock === 'number') {
                const prizeDoc = await transaction.get(prizeRef);
                if (!prizeDoc.exists() || (prizeDoc.data().stock ?? 0) < 1) {
                    throw new Error("Prémio esgotado!");
                }
                transaction.update(prizeRef, { stock: increment(-1) });
            }
        });
        
        setSellers(prev => prev.map(s => s.id === currentSeller.id ? { ...s, points: (s.points || 0) - prize.points } : s));

        toast({
            title: 'Resgate bem-sucedido!',
            description: `Você resgatou "${prize.name}" por ${formatPoints(prize.points)}.`,
        });

      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
          toast({ variant: "destructive", title: "Erro no Resgate", description: errorMessage });
      } finally {
          setRedeemingId(null);
      }
  }

  const totalPoints = (currentSeller?.points || 0) + (currentSeller?.extraPoints || 0);

  if (loading) {
    return <EmptyState Icon={Loader2} title="A carregar prémios..." description="Aguarde um momento." className="animate-spin"/>
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
            const isOutOfStock = typeof prize.stock === 'number' && prize.stock <= 0;
            const isDisabled = !canAfford || isOutOfStock || redeemingId === prize.id;

            return (
              <Card key={prize.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="p-0 relative">
                  <Image src={prize.imageUrl || 'https://placehold.co/600x400/27272a/FFF?text=Prêmio'} alt={prize.name} width={600} height={400} className="w-full h-48 object-cover" />
                  {isOutOfStock && <Badge variant="destructive" className="absolute top-2 right-2">Esgotado</Badge>}
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
                    <Button onClick={() => handleRedeem(prize)} disabled={isDisabled} className="w-full font-bold">
                        {redeemingId === prize.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isOutOfStock ? 'Esgotado' : (canAfford ? 'Resgatar' : 'Pontos Insuficientes')}
                    </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState Icon={ShoppingBag} title="Nenhum prémio disponível" description="Verifique novamente mais tarde para novas recompensas."/>
      )}
    </div>
  );
}
