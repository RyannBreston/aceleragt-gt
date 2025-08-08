'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Importando o componente Image
import { ShoppingBag, Loader2, Edit, Trash2, PlusCircle, Save } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import type { PrizeItem } from '@/lib/types';

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formatPoints = (value: number) => `${value.toLocaleString('pt-BR')} pts`;

// ####################################################################
// ### 1. SUB-COMPONENTE: MODAL DO FORMULÁRIO ###
// ####################################################################
const PrizeFormModal = ({ isOpen, setIsOpen, prize, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; prize: Partial<PrizeItem> | null; onSave: (prize: Partial<PrizeItem>) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<PrizeItem>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setFormData(prize || { name: '', description: '', points: 1000, stock: 1, imageUrl: '' });
    }, [prize]);

    const handleChange = (field: keyof PrizeItem, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.points) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios' });
            return;
        }
        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? 'Editar Prémio' : 'Adicionar Novo Prémio'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Prémio</Label>
                        <Input id="name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="points">Custo (Pontos)</Label>
                            <Input id="points" type="number" value={formData.points || 0} onChange={(e) => handleChange('points', Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input id="stock" type="number" value={formData.stock ?? ''} onChange={(e) => handleChange('stock', Number(e.target.value))} placeholder="Deixe em branco para ilimitado"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL da Imagem</Label>
                        <Input id="imageUrl" value={formData.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} />
                    </div>
                    {formData.imageUrl && (
                        <div className="flex flex-col items-center space-y-2">
                            <Label className="text-sm text-muted-foreground">Pré-visualização</Label>
                            <Image src={formData.imageUrl} alt="Pré-visualização" width={96} height={96} className="object-cover rounded-md border" onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100/27272a/FFF?text=Inválida'}/>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// ####################################################################
// ### 2. COMPONENTE PRINCIPAL DA PÁGINA ###
// ####################################################################
export default function AdminLojaPage() {
    const { toast } = useToast();
    const [prizes, setPrizes] = useState<PrizeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPrize, setCurrentPrize] = useState<Partial<PrizeItem> | null>(null);

    const prizesCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/prizes`;

    useEffect(() => {
        const prizesQuery = query(collection(db, prizesCollectionPath), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(prizesQuery, (snapshot) => {
            setPrizes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrizeItem)));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, [prizesCollectionPath]);

    const openModal = (prize?: PrizeItem) => {
        setCurrentPrize(prize || null);
        setIsModalOpen(true);
    };

    const handleSavePrize = async (prizeData: Partial<PrizeItem>) => {
        try {
            const dataToSave = { ...prizeData, updatedAt: serverTimestamp() };
            if (prizeData.id) {
                await updateDoc(doc(db, prizesCollectionPath, prizeData.id), dataToSave);
                toast({ title: 'Prémio Atualizado!' });
            } else {
                await addDoc(collection(db, prizesCollectionPath), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Prémio Adicionado!' });
            }
            setIsModalOpen(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            toast({ variant: 'destructive', title: 'Falha ao Salvar', description: errorMessage });
        }
    };

    const handleDeletePrize = async (prizeId: string) => {
        try {
            await deleteDoc(doc(db, prizesCollectionPath, prizeId));
            toast({ title: 'Prémio Excluído!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Excluir' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <ShoppingBag className="size-8 text-primary" />
                    <h1 className="text-3xl font-bold">Loja de Prémios</h1>
                </div>
                <Button onClick={() => openModal()}><PlusCircle className="mr-2" /> Adicionar Prémio</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Prémios Disponíveis</CardTitle>
                    <CardDescription>Lista de todos os itens que os vendedores podem resgatar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Prémio</TableHead>
                                    <TableHead>Custo</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : prizes.length > 0 ? prizes.map(prize => (
                                    <TableRow key={prize.id}>
                                        <TableCell className="font-medium flex items-center gap-4">
                                            <Image src={prize.imageUrl || 'https://placehold.co/60x60/27272a/FFF?text=Prêmio'} alt={prize.name} width={48} height={48} className="object-cover rounded-md bg-muted" />
                                            <div>
                                                <p>{prize.name}</p>
                                                <p className="text-xs text-muted-foreground">{prize.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">{formatPoints(prize.points)}</TableCell>
                                        <TableCell>{prize.stock ?? 'Ilimitado'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(prize)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita e irá remover o prémio &quot;{prize.name}&quot; permanentemente.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePrize(prize.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <p className="font-semibold">Nenhum prémio adicionado.</p>
                                            <p className="text-sm text-muted-foreground">Clique em &quot;Adicionar Prémio&quot; para começar.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <PrizeFormModal 
                isOpen={isModalOpen} 
                setIsOpen={setIsModalOpen} 
                prize={currentPrize}
                onSave={handleSavePrize}
            />
        </div>
    );
}