/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Archive, Loader2, Trophy } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateSellerPrizes } from '@/lib/utils';
import type { CycleSnapshot } from '@/lib/types';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function HistoryPage() {
    const [history, setHistory] = useState<CycleSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
    const historyCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/cycle_history`;

    useEffect(() => {
        const q = query(collection(db, historyCollectionPath), orderBy('endDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleSnapshot));
            setHistory(historyData);
            if (historyData.length > 0) {
                setSelectedCycleId(historyData[0].id);
            }
            setIsLoading(false);
        }, () => setIsLoading(false));

        return () => unsubscribe();
    }, [historyCollectionPath]);

    const selectedCycle = useMemo(() => {
        if (!selectedCycleId) return null;
        return history.find(h => h.id === selectedCycleId);
    }, [history, selectedCycleId]);

    const rankedSellers = useMemo(() => {
        if (!selectedCycle) return [];
        const sellersWithPrizes = selectedCycle.sellers.map(s => 
            calculateSellerPrizes(s, selectedCycle.sellers, selectedCycle.goals)
        );
        return sellersWithPrizes.sort((a, b) => b.totalPrize - a.totalPrize);
    }, [selectedCycle]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin size-8" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Archive className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Histórico de Ciclos</h1>
            </div>

            {history.length > 0 && (
                <div className="max-w-sm">
                    <Select onValueChange={setSelectedCycleId} defaultValue={selectedCycleId || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um ciclo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {history.map(cycle => (
                                <SelectItem key={cycle.id} value={cycle.id}>
                                    Ciclo encerrado em {format(cycle.endDate.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedCycle ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Ranking do Ciclo</CardTitle>
                        <CardDescription>Classificação final dos vendedores para o ciclo selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">Pos.</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead className="text-right">Prémio Final</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankedSellers.map((seller, index) => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-bold text-lg text-center">{index + 1}º</TableCell>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(seller.totalPrize)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card className="flex flex-col items-center justify-center p-12">
                     <Trophy className="size-16 text-muted-foreground mb-4" />
                    <CardTitle>Nenhum histórico encontrado</CardTitle>
                    <CardDescription className="mt-2">Ainda não há ciclos finalizados para exibir.</CardDescription>
                </Card>
            )}
        </div>
    );
}