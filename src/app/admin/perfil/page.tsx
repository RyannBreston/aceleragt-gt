/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, PlusCircle, Loader2, Trash2, KeyRound, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller, Admin } from '@/lib/types';

// --- Sub-componente: Modal de Gestão de Vendedor (Criar/Editar) ---
const SellerFormModal = ({ isOpen, setIsOpen, seller, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; seller: Partial<Seller> | null; onSave: (data: Partial<Seller>, password?: string) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<Seller>>({ name: '', email: '' });
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => { 
        setFormData(seller || { name: '', email: '' }); 
        setPassword('');
    }, [seller]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // --- CORRIGIDO ---
        const { name, value } = (e.target as any);
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        await onSave(formData, password);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{seller?.id ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Nome Completo</Label><Input name="name" value={formData.name || ''} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" value={formData.email || ''} onChange={handleChange} /></div>
                    {!seller?.id && <div className="space-y-2"><Label>Senha Inicial</Label><Input name="password" type="password" value={password} placeholder="Mínimo 6 caracteres" onChange={(e) => setPassword(e.target.value)} /></div>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Sub-componente: Modal de Gestão de Administrador (Criar/Editar) ---
const AdminFormModal = ({ isOpen, setIsOpen, admin, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; admin: Partial<Admin> | null; onSave: (data: Partial<Admin>, password?: string) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<Admin>>({ name: '', email: '' });
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { 
        setFormData(admin || { name: '', email: '' }); 
        setPassword('');
    }, [admin]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // --- CORRIGIDO ---
        const { name, value } = (e.target as any);
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        await onSave(formData, password);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{admin?.id ? 'Editar Administrador' : 'Adicionar Novo Administrador'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Nome Completo</Label><Input name="name" value={formData.name || ''} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Email de Login</Label><Input name="email" type="email" value={formData.email || ''} onChange={handleChange} /></div>
                    {!admin?.id && <div className="space-y-2"><Label>Senha Inicial</Label><Input name="password" type="password" value={password} placeholder="Mínimo 6 caracteres" onChange={(e) => setPassword(e.target.value)} /></div>}
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- Sub-componente: Modal para Alterar a Senha ---
const ChangePasswordModal = ({ user, isOpen, setIsOpen, userType }: { user: Seller | Admin | null; isOpen: boolean; setIsOpen: (open: boolean) => void; userType: 'Vendedor' | 'Administrador' }) => {
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        if (!user) return;
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Senha muito curta", description: "A nova senha deve ter no mínimo 6 caracteres." });
            return;
        }

        setIsUpdating(true);
        try {
            const functionName = userType === 'Vendedor' ? 'changeSellerPassword' : 'changeAdminPassword';
            const changePasswordFunction = httpsCallable(functions, functionName);
            await changePasswordFunction({ uid: user.id, newPassword });
            toast({ title: 'Senha atualizada com sucesso!', description: `A senha de ${user.name} foi alterada.` });
            setIsOpen(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: errorMessage });
        } finally {
            setIsUpdating(false);
            setNewPassword('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Senha de {user?.name}</DialogTitle>
                    <DialogDescription>O utilizador será desconectado e precisará de usar a nova senha.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="newPassword">Nova Senha</Label><Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar Nova Senha</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- Página Principal de Perfil ---
export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers, admin, setAdmin } = useAdminContext();
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Seller | Admin | null>(null);
    const [userType, setUserType] = useState<'Vendedor' | 'Administrador'>('Vendedor');
    const [isEditing, setIsEditing] = useState(false);

    const openModal = (type: 'seller' | 'admin' | 'password', user?: Seller | Admin, userRole?: 'Vendedor' | 'Administrador') => {
        setSelectedUser(user || null);
        setIsEditing(!!user);
        if (type === 'seller') setIsSellerModalOpen(true);
        if (type === 'admin') setIsAdminModalOpen(true);
        if (type === 'password' && userRole) {
            setUserType(userRole);
            setIsPasswordModalOpen(true);
        }
    };

    const handleSaveAdmin = async (data: Partial<Admin>, password?: string) => {
        try {
            if (data.id) {
                const updateAdminFunction = httpsCallable(functions, 'updateAdmin');
                await updateAdminFunction({ uid: data.id, name: data.name, email: data.email });
                if(data.name && data.email) setAdmin({ ...admin, name: data.name, email: data.email } as Admin);
                toast({ title: 'Administrador atualizado!' });
            } else {
                const createAdminFunction = httpsCallable(functions, 'createAdmin');
                await createAdminFunction({ ...data, password });
                toast({ title: 'Administrador adicionado!' });
            }
            setIsAdminModalOpen(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: errorMessage });
        }
    };
    
    const handleSaveSeller = async (data: Partial<Seller>, password?: string) => {
        try {
            if (data.id) {
                const updateSellerFunction = httpsCallable(functions, 'updateSeller');
                await updateSellerFunction({ uid: data.id, name: data.name, email: data.email });
                toast({ title: 'Vendedor atualizado!' });
            } else {
                const createSellerFunction = httpsCallable(functions, 'createSeller');
                await createSellerFunction({ ...data, password });
                toast({ title: 'Vendedor adicionado!' });
            }
            setIsSellerModalOpen(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: errorMessage });
        }
    };
    
    const handleDeleteSeller = async (seller: Seller) => {
        try {
            const deleteSellerFunction = httpsCallable(functions, 'deleteSeller');
            await deleteSellerFunction({ uid: seller.id });
            toast({ title: 'Vendedor apagado!', description: `${seller.name} foi removido.` });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao apagar', description: errorMessage });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><UserCog className="size-8 text-primary" /><h1 className="text-3xl font-bold">Gerir Perfis</h1></div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Perfil do Administrador</CardTitle>
                        <CardDescription>Informações da sua conta de administrador.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openModal('admin', admin || undefined)}><Edit className="mr-2 size-4"/>Editar Perfil</Button>
                        {admin && <Button variant="outline" size="sm" onClick={() => openModal('password', admin, 'Administrador')}><KeyRound className="mr-2 size-4"/>Alterar Senha</Button>}
                        <Button size="sm" onClick={() => openModal('admin')}><PlusCircle className="mr-2 size-4" /> Adicionar Admin</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm font-medium text-muted-foreground">Nome</p><p className="font-semibold">{admin?.name}</p></div>
                        <div><p className="text-sm font-medium text-muted-foreground">Email</p><p className="font-semibold">{admin?.email}</p></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                       <CardTitle>Vendedores Registados</CardTitle>
                       <CardDescription>Adicione, edite, altere senhas e gira os seus vendedores.</CardDescription>
                   </div>
                   <Button onClick={() => openModal('seller')}><PlusCircle className="mr-2 size-4" /> Adicionar Vendedor</Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {sellers.map(seller => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell>{seller.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button title="Editar Vendedor" variant="ghost" size="icon" onClick={() => openModal('seller', seller)}><Edit className="size-4" /></Button>
                                            <Button title="Alterar Senha" variant="ghost" size="icon" onClick={() => openModal('password', seller, 'Vendedor')}><KeyRound className="size-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button title="Apagar Vendedor" variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação irá apagar o vendedor {seller.name}.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSeller(seller)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <SellerFormModal isOpen={isSellerModalOpen} setIsOpen={setIsSellerModalOpen} seller={isEditing ? selectedUser as Seller : null} onSave={handleSaveSeller} />
            <AdminFormModal isOpen={isAdminModalOpen} setIsOpen={setIsAdminModalOpen} admin={isEditing ? selectedUser as Admin : null} onSave={handleSaveAdmin} />
            <ChangePasswordModal user={selectedUser} isOpen={isPasswordModalOpen} setIsOpen={setIsPasswordModalOpen} userType={userType} />
        </div>
    );
}