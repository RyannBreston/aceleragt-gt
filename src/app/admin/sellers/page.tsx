'use client';

import React, { useState, useEffect } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Seller } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Componente de formulário para criar/editar vendedor
const SellerForm = ({ seller, onSave, onCancel }: { seller?: Seller | null, onSave: (data: any) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        name: seller?.name || '',
        email: seller?.email || '',
        password: '',
        sales_value: seller?.salesValue || 0,
        ticket_average: seller?.ticketAverage || 0,
        pa: seller?.pa || 0,
        points: seller?.points || 0,
        extra_points: seller?.extra_points || 0,
    });

    const isEditing = !!seller;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing && (!formData.password || formData.password.length < 6)) {
            alert('Ao criar um novo vendedor, a senha é obrigatória e deve ter pelo menos 6 caracteres.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                {!isEditing && (
                    <div className="grid items-center gap-1.5 sm:col-span-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
                    </div>
                )}
                 <div className="grid items-center gap-1.5">
                    <Label htmlFor="points">Pontos</Label>
                    <Input id="points" type="number" value={formData.points} onChange={handleChange} />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="extra_points">Pontos Extra</Label>
                    <Input id="extra_points" type="number" value={formData.extra_points} onChange={handleChange} />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="sales_value">Valor de Vendas</Label>
                    <Input id="sales_value" type="number" step="0.01" value={formData.sales_value} onChange={handleChange} />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="ticket_average">Ticket Médio</Label>
                    <Input id="ticket_average" type="number" step="0.01" value={formData.ticket_average} onChange={handleChange} />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="pa">PA (Peças por Atendimento)</Label>
                    <Input id="pa" type="number" value={formData.pa} onChange={handleChange} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </DialogFooter>
        </form>
    );
};


export default function SellersPage() {
    const { sellers, isLoading, createSeller, updateSeller, deleteSeller } = useAdminContext();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

    const handleOpenDialog = (seller?: Seller) => {
        setEditingSeller(seller || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingSeller(null);
    };

    const handleSave = async (data: any) => {
        try {
            if (editingSeller) {
                await updateSeller({ ...data, id: editingSeller.id });
            } else {
                await createSeller(data);
            }
            handleCloseDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro!', description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSeller(id);
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Erro!', description: error.message });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerir Vendedores</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Vendedor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingSeller ? 'Editar' : 'Criar'} Vendedor</DialogTitle>
                            <DialogDescription>
                                {editingSeller ? 'Atualize os dados do vendedor.' : 'Preencha os dados para criar um novo vendedor.'}
                            </DialogDescription>
                        </DialogHeader>
                        <SellerForm
                            seller={editingSeller}
                            onSave={handleSave}
                            onCancel={handleCloseDialog}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Pontos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sellers.length > 0 ? (
                            sellers.map((seller) => (
                                <TableRow key={seller.id}>
                                    <TableCell className="font-medium">{seller.name}</TableCell>
                                    <TableCell>{seller.email}</TableCell>
                                    <TableCell className="text-right">{seller.points}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(seller)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. Isto irá apagar permanentemente o vendedor e todos os seus dados.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(seller.id)}>
                                                        Apagar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Nenhum vendedor encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}