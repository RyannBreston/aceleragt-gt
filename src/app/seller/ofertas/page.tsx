'use client';

import * as React from 'react';
import Image from 'next/image';
import { ShoppingBag, Loader2, Tag, Calendar, Sparkles, Star as StarIcon } from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Offer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function SellerOffersPage() {
  const { toast } = useToast();
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActiveOffers = async () => {
      setLoading(true);
      try {
        const now = Timestamp.now();
        const offersCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/offers`;
        const offersQuery = query(
          collection(db, offersCollectionPath), 
          where('isActive', '==', true),
          where('startDate', '<=', now)
        );
        
        const snapshot = await getDocs(offersQuery);
        let offersList = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          startDate: d.data().startDate?.toDate(),
          expirationDate: d.data().expirationDate?.toDate(),
        } as Offer));

        offersList = offersList.filter(offer => offer.expirationDate && offer.expirationDate >= new Date());
        
        setOffers(offersList.sort((a, b) => (a.promotionalPrice || 0) - (b.promotionalPrice || 0)));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        toast({ variant: 'destructive', title: 'Erro ao Carregar Ofertas', description: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOffers();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando ofertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <ShoppingBag className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ofertas Ativas</h1>
          <p className="text-muted-foreground">Confira as promoções disponíveis para os clientes.</p>
        </div>
      </div>

      {offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {offers.map(offer => (
            <Card key={offer.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader className="p-0 relative">
                <Image src={offer.imageUrl || 'https://placehold.co/600x400/27272a/FFF?text=Produto'} alt={offer.name} width={600} height={400} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                    {offer.isFlashOffer && <Badge variant="destructive" className="animate-pulse"><Sparkles className="size-3 mr-1" />Relâmpago</Badge>}
                    {offer.isBestSeller && <Badge className="bg-yellow-400 text-black hover:bg-yellow-500"><StarIcon className="size-3 mr-1" />Mais Vendido</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <Badge variant="secondary" className="self-start mb-2">{offer.category}</Badge>
                <CardTitle className="text-lg mb-2 flex-grow">{offer.name}</CardTitle>
                {offer.description && <CardDescription className="text-xs mb-4">{offer.description}</CardDescription>}
                
                <div className="space-y-2 mt-auto">
                    {offer.originalPrice && <p className="text-sm text-muted-foreground line-through">{formatCurrency(offer.originalPrice)}</p>}
                    <p className="text-2xl font-bold text-primary">{formatCurrency(offer.promotionalPrice)}</p>
                </div>
              </CardContent>
              {offer.expirationDate && (
                <CardFooter className="p-4 bg-muted/50">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="size-4 mr-2" />
                      <span>Válido até: {format(offer.expirationDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
                <Tag className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma oferta ativa no momento.</h3>
                <p className="mt-1 text-sm">Verifique novamente mais tarde para novas promoções.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}