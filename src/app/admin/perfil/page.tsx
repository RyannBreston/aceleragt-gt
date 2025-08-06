'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, PlusCircle, Loader2, Trash2, KeyRound, Edit, Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller } from '@/lib/types';

// --- Sub-componente: Modal de Gestão de Vendedor (Criar/Editar) ---
const SellerFormModal = ({ isOpen, setIsOpen, seller, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; seller: Partial<Seller> | null; onSave: (data: Partial<Seller>) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<Seller>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        // Quando o 'seller' muda, reinicia o formulário. Se 'seller' for nulo, prepara para criar um novo.
        setFormData(seller || { name: '', email: '', password: '' });
    }, [seller]);

    const handleSave = async () => {
        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{seller?.id ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Nome Completo</Label><Input value={formData.name || ''} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} /></div>
                    <div className="space-y-2"><Label>Email de Login</Label><Input type="email" value={formData.email || ''} onChange={(e) => setFormData(p => ({...p, email: e.target.value}))} /></div>
                    {/* O campo de senha só aparece ao criar um novo vendedor */}
                    {!seller?.id && <div className="space-y-2"><Label>Senha Inicial</Label><Input type="password" placeholder="Mínimo 6 caracteres" onChange={(e) => setFormData(p => ({...p, password: e.target.value}))} /></div>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Sub-componente: Modal para Alterar a Senha ---
const ChangePasswordModal = ({ seller, isOpen, setIsOpen }: { seller: Seller | null; isOpen: boolean; setIsOpen: (open: boolean) => void; }) => {
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        if (!seller) return;
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Senha muito curta" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "As senhas não coincidem" });
            return;
        }

        setIsUpdating(true);
        try {
            const changePasswordFunction = httpsCallable(functions, 'changeSellerPassword');
            await changePasswordFunction({ uid: seller.id, newPassword });
            toast({ title: 'Senha atualizada com sucesso!' });
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: error.message });
        } finally {
            setIsUpdating(false);
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Senha de {seller?.name}</DialogTitle>
                    <DialogDescription>O vendedor será desconectado e precisará usar a nova senha.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="newPassword">Nova Senha</Label><Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
                    <div className="space-y-2"><Label htmlFor="confirmPassword">Confirmar Nova Senha</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar Nova Senha</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Sub-componente: Modal para Editar Pontos ---
const EditPointsModal = ({ seller, isOpen, setIsOpen }: { seller: Seller | null; isOpen: boolean; setIsOpen: (open: boolean) => void; }) => {
    const { toast } = useToast();
    const [points, setPoints] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (seller) {
            setPoints(seller.points || 0);
        }
    }, [seller]);

    const handleSavePoints = async (newPoints: number) => {
        if (!seller) return;

        setIsSubmitting(true);
        try {
            const updatePointsFunction = httpsCallable(functions, 'updateSellerPoints');
            await updatePointsFunction({ uid: seller.id, points: newPoints });

            toast({ title: 'Pontos Atualizados!', description: `A pontuação de ${seller.name} foi definida para ${newPoints}.` });
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar pontos', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Pontos de {seller?.name}</DialogTitle>
                    <DialogDescription>
                        Altere o valor dos pontos base do vendedor. Os pontos extras são geridos na página de Configurações.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="points">Pontuação Base</Label>
                        <Input 
                            id="points" 
                            type="number" 
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value))}
                        />
                    </div>
                    <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => handleSavePoints(0)}
                        disabled={isSubmitting}
                    >
                        Zerar Pontuação Base
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={() => handleSavePoints(points)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Salvar Pontos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- Página Principal de Perfil ---
export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers } = useAdminContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    const openModal = (type: 'edit' | 'password' | 'points', seller?: Seller) => {
        setSelectedSeller(seller || null);
        if (type === 'edit') setIsEditModalOpen(true);
        if (type === 'password') setIsPasswordModalOpen(true);
        if (type === 'points') setIsPointsModalOpen(true);
    };

    const handleSaveSeller = async (data: Partial<Seller>) => {
        try {
            if (data.id) { // Modo de Edição
                const updateSellerFunction = httpsCallable(functions, 'updateSeller');
                await updateSellerFunction({ uid: data.id, name: data.name, email: data.email });
                toast({ title: 'Vendedor atualizado!' });
            } else { // Modo de Criação
                const createSellerFunction = httpsCallable(functions, 'createSeller');
                await createSellerFunction(data);
                toast({ title: 'Vendedor adicionado!' });
            }
            setIsEditModalOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        }
    };
    
    const handleDeleteSeller = async (seller: Seller) => {
        try {
            const deleteSellerFunction = httpsCallable(functions, 'deleteSeller');
            await deleteSellerFunction({ uid: seller.id });
            toast({ title: 'Vendedor apagado!', description: `${seller.name} foi removido com sucesso.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao apagar', description: error.message });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><UserCog className="size-8 text-primary" /><h1 className="text-3xl font-bold">Gerir Vendedores</h1></div>
                <Button onClick={() => openModal('edit')}><PlusCircle className="mr-2 size-4" /> Adicionar Vendedor</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vendedores Registados</CardTitle>
                    <CardDescription>Adicione, edite e gira as permissões dos seus vendedores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Pontos Totais</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sellers.length > 0 ? sellers.map(seller => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell>{seller.email}</TableCell>
                                        <TableCell className="text-center font-semibold">{(seller.points || 0) + (seller.extraPoints || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button title="Editar Pontos" variant="ghost" size="icon" onClick={() => openModal('points', seller)}><Star className="size-4 text-yellow-500" /></Button>
                                            <Button title="Editar Vendedor" variant="ghost" size="icon" onClick={() => openModal('edit', seller)}><Edit className="size-4" /></Button>
                                            <Button title="Alterar Senha" variant="ghost" size="icon" onClick={() => openModal('password', seller)}><KeyRound className="size-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button title="Apagar Vendedor" variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita e irá apagar permanentemente o vendedor {seller.name}.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSeller(seller)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum vendedor registado.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <SellerFormModal isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} seller={selectedSeller} onSave={handleSaveSeller} />
            <ChangePasswordModal seller={selectedSeller} isOpen={isPasswordModalOpen} setIsOpen={setIsPasswordModalOpen} />
            <EditPointsModal seller={selectedSeller} isOpen={isPointsModalOpen} setIsOpen={setIsPointsModalOpen} />
        </div>
    );
}