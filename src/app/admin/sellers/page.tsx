/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Loader2, Edit, Trash2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@/lib/types';

// Esquema de validação para o formulário de vendedor
const sellerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }).optional(),
}).refine(data => !!data.id || !!data.password, {
    message: 'A senha é obrigatória para novos vendedores.',
    path: ['password'],
});

type SellerFormData = z.infer<typeof sellerSchema>;

// --- Componente do Formulário de Vendedor ---
const SellerForm = ({ seller, onSave, onCancel }: { seller?: Seller | null, onSave: (data: SellerFormData) => void, onCancel: () => void }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SellerFormData>({
        resolver: zodResolver(sellerSchema),
        defaultValues: { id: seller?.id, name: seller?.name || '', email: seller?.email || '' },
    });

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{seller ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                {!seller && (
                     <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" {...register('password')} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                         Salvar
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};


// --- Página Principal de Gerenciamento de Vendedores ---
export default function SellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const { toast } = useToast();

    // Carregar vendedores
    const fetchSellers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/sellers');
            if (!response.ok) throw new Error('Falha ao carregar vendedores.');
            const data = await response.json();
            setSellers(data);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSellers();
    }, [fetchSellers]);

    const handleSave = async (data: SellerFormData) => {
        try {
            const url = data.id ? `/api/sellers/${data.id}` : '/api/register';
            const method = data.id ? 'PUT' : 'POST';
            const body = JSON.stringify({ ...data, role: 'seller' });

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao salvar o vendedor.');
            }
            
            toast({ title: "Sucesso!", description: `Vendedor ${data.name} foi salvo.` });
            setIsFormOpen(false);
            fetchSellers(); // Recarregar a lista
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
         if (!window.confirm("Tem certeza que deseja excluir este vendedor?")) return;
        try {
            const response = await fetch(`/api/sellers/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao excluir o vendedor.');
            }
            toast({ title: "Sucesso!", description: "Vendedor excluído." });
            fetchSellers();
        } catch (error: any) {
             toast({ variant: "destructive", title: "Erro ao Excluir", description: error.message });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gerir Vendedores</h1>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                         <Button onClick={() => setSelectedSeller(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Vendedor
                        </Button>
                    </DialogTrigger>
                   {isFormOpen && <SellerForm seller={selectedSeller} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
                </Dialog>
            </div>

            <Card>
                <CardContent className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {sellers.map((seller) => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell>{seller.email}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setSelectedSeller(seller); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(seller.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
