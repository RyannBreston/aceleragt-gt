'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useSellerContext } from '@/contexts/SellerContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, runTransaction } from 'firebase/firestore';
import type { PrizeItem } from '@/lib/types';
import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ARTIFACTS_PATH = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data`;
const PRIZE_COLLECTION = `${ARTIFACTS_PATH}/prizes`;

const PrizeCard = ({ prize, onRedeem, currentPoints }: { prize: PrizeItem; onRedeem: (prize: PrizeItem) => void; currentPoints: number; }) => {
    const canRedeem = currentPoints >= prize.points;
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="relative aspect-video">
                    <Image src={prize.imageUrl} alt={prize.name} layout="fill" objectFit="cover" className="rounded-t-lg" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle>{prize.name}</CardTitle>
                <CardDescription className="mt-2">{prize.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">{prize.points.toLocaleString('pt-BR')} pts</span>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={!canRedeem}>Resgatar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Resgate</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você está prestes a resgatar &quot;{prize.name}&quot; por {prize.points} pontos. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRedeem(prize)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
};

export default function LojaPage() {
    const { currentSeller } = useSellerContext();
    const { toast } = useToast();
    const [prizes, setPrizes] = useState<PrizeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, PRIZE_COLLECTION), orderBy('points', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPrizes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrizeItem)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRedeem = async (prize: PrizeItem) => {
        if (!currentSeller) return;

        const totalPoints = currentSeller.points || 0;
        if (totalPoints < prize.points) {
           toast({ variant: 'destructive', title: 'Pontos Insuficientes!' });
           return;
        }

        const sellerRef = doc(db, 'sellers', currentSeller.id);

        try {
            await runTransaction(db, async (transaction) => {
                const sellerDoc = await transaction.get(sellerRef);
                if (!sellerDoc.exists()) {
                    throw "Vendedor não encontrado.";
                }

                const newPoints = (sellerDoc.data().points || 0) - prize.points;
                if (newPoints < 0) {
                    throw "Pontos insuficientes.";
                }
                
                transaction.update(sellerRef, { points: newPoints });
            });

            toast({ title: 'Resgate bem-sucedido!', description: `Você resgatou ${prize.name}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no resgate', description: String(error) });
        }
    };

    if (isLoading || !currentSeller) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ShoppingBag className="size-8 text-primary" />
                    <h1 className="text-3xl font-bold">Loja de Prémios</h1>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Seus Pontos</p>
                    <p className="text-2xl font-bold text-primary">{(currentSeller.points || 0).toLocaleString('pt-BR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prizes.map(prize => (
                    <PrizeCard key={prize.id} prize={prize} onRedeem={handleRedeem} currentPoints={currentSeller.points || 0} />
                ))}
            </div>
        </div>
    );
}
