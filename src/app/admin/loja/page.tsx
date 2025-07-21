'use client';

import * as React from 'react';
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

const formatPoints = (value: number) => {
    return `${value.toLocaleString('pt-BR')} pts`;
};

export default function AdminLojaPage() {
  const { toast } = useToast();
  const [prizes, setPrizes] = React.useState<PrizeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentPrize, setCurrentPrize] = React.useState<Partial<PrizeItem> | null>(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const prizesCollectionPath = `artifacts/${appId}/public/data/prizes`;

  React.useEffect(() => {
    const prizesQuery = query(collection(db, prizesCollectionPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(prizesQuery, (snapshot) => {
      const prizesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrizeItem));
      setPrizes(prizesList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar prémios:", error);
      toast({ variant: 'destructive', title: 'Erro ao Carregar Prémios', description: "Verifique as permissões do Firestore." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [prizesCollectionPath, toast]);

  const openModal = (prize?: PrizeItem) => {
    setCurrentPrize(prize ? { ...prize } : { name: '', description: '', points: 1000, stock: 1, imageUrl: '' });
    setIsModalOpen(true);
  };

  const handleSavePrize = async () => {
    if (!currentPrize || !currentPrize.name || !currentPrize.points) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Preencha pelo menos o nome e os pontos do prémio.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const prizeData = { ...currentPrize, updatedAt: serverTimestamp() };

      if (prizeData.id) {
        const prizeRef = doc(db, prizesCollectionPath, prizeData.id);
        await updateDoc(prizeRef, prizeData);
        toast({ title: 'Prémio Atualizado!' });
      } else {
        await addDoc(collection(db, prizesCollectionPath), { ...prizeData, createdAt: serverTimestamp() });
        toast({ title: 'Prémio Adicionado!' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (window.confirm(`Tem certeza que deseja excluir este prémio?`)) {
        await deleteDoc(doc(db, prizesCollectionPath, prizeId));
        toast({ title: 'Prémio Excluído!' });
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
          <CardDescription>Lista de todos os itens que os vendedores podem resgatar com pontos.</CardDescription>
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
                        <img src={prize.imageUrl || 'https://placehold.co/60x60/27272a/FFF?text=Prêmio'} alt={prize.name} className="w-12 h-12 object-cover rounded-md bg-muted" />
                        <div>
                            <p>{prize.name}</p>
                            <p className="text-xs text-muted-foreground">{prize.description}</p>
                        </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPoints(prize.points)}</TableCell>
                    <TableCell>{prize.stock ?? 'Ilimitado'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openModal(prize)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePrize(prize.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum prémio adicionado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentPrize?.id ? 'Editar Prémio' : 'Adicionar Novo Prémio'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nome</Label><Input id="name" value={currentPrize?.name || ''} onChange={(e) => setCurrentPrize(p => ({...p, name: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descrição</Label><Textarea id="description" value={currentPrize?.description || ''} onChange={(e) => setCurrentPrize(p => ({...p, description: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="points" className="text-right">Custo (Pontos)</Label><Input id="points" type="number" value={currentPrize?.points || 0} onChange={(e) => setCurrentPrize(p => ({...p, points: Number(e.target.value)}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="stock" className="text-right">Stock</Label><Input id="stock" type="number" value={currentPrize?.stock ?? ''} onChange={(e) => setCurrentPrize(p => ({...p, stock: Number(e.target.value)}))} className="col-span-3" placeholder="Deixe em branco para ilimitado"/></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="imageUrl" className="text-right">URL da Imagem</Label><Input id="imageUrl" value={currentPrize?.imageUrl || ''} onChange={(e) => setCurrentPrize(p => ({...p, imageUrl: e.target.value}))} className="col-span-3" /></div>
          </div>
          <DialogFooter><Button onClick={handleSavePrize} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}