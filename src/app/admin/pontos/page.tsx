/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { Seller } from '@/lib/types';

export default function EditExtraPointsPage() {
    const { sellers, setSellers } = useAdminContext();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [extraPoints, setExtraPoints] = useState(0);

    const handleEditClick = (seller: Seller) => {
        setSelectedSeller(seller);
        setExtraPoints(seller.extraPoints || 0);
    };

    const handleSave = async () => {
        if (!selectedSeller) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const sellerRef = doc(db, 'sellers', selectedSeller.id);
            batch.update(sellerRef, { extraPoints });

            await batch.commit();

            setSellers(prevSellers => 
                prevSellers.map(s =>
                    s.id === selectedSeller.id ? { ...s, extraPoints } : s
                )
            );

            toast({ title: "Prémios de Corridinha atualizados com sucesso!" });
            setSelectedSeller(null);
        } catch (error) {
            console.error("Error updating extra points: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao atualizar prémios",
                description: "Ocorreu um erro ao tentar salvar os novos prémios.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Editar Prêmios de Corridinha</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Prêmio de Corridinha</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sellers.map((seller) => (
                                <TableRow key={seller.id}>
                                    <TableCell>{seller.name}</TableCell>
                                    <TableCell>{seller.extraPoints || 0}</TableCell>
                                    <TableCell>
                                        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedSeller(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(seller)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Editar Prêmios de {selectedSeller?.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Input
                                                        type="number"
                                                        value={extraPoints}
                                                        onChange={(e) => setExtraPoints(Number((e.target as any).value))}
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleSave} disabled={isSaving}>
                                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
