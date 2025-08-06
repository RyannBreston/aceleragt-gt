'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, PlusCircle, Loader2, Trash2, KeyRound, Edit, Save, Star, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions, auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller } from '@/lib/types';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Sub-componente: Modal de Gestão de Vendedor (Criar/Editar) ---
const SellerFormModal = ({ isOpen, setIsOpen, seller, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; seller: Partial<Seller> | null; onSave: (data: Partial<Seller>) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<Seller>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => { setFormData(seller || { name: '', email: '', password: '' }); }, [seller]);
    const handleSave = async () => { setIsSubmitting(true); await onSave(formData); setIsSubmitting(false); };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{seller?.id ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Nome Completo</Label><Input value={formData.name || ''} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} /></div>
                    <div className="space-y-2"><Label>Email de Login</Label><Input type="email" value={formData.email || ''} onChange={(e) => setFormData(p => ({...p, email: e.target.value}))} /></div>
                    {!seller?.id && <div className="space-y-2"><Label>Senha Inicial</Label><Input type="password" placeholder="Mínimo 6 caracteres" onChange={(e) => setFormData(p => ({...p, password: e.target.value}))} /></div>}
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Sub-componente: Modal para Alterar a Senha de um Vendedor ---
const ChangePasswordModal = ({ seller, isOpen, setIsOpen }: { seller: (Seller | User | null); isOpen: boolean; setIsOpen: (open: boolean) => void; }) => {
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const handleUpdate = async () => { if (!seller?.uid) return; if (newPassword.length < 6) { toast({ variant: "destructive", title: "Senha muito curta" }); return; } if (newPassword !== confirmPassword) { toast({ variant: "destructive", title: "As senhas não coincidem" }); return; } setIsUpdating(true); try { const func = httpsCallable(functions, 'changeSellerPassword'); await func({ uid: seller.uid, newPassword }); toast({ title: 'Senha atualizada com sucesso!' }); setIsOpen(false); } catch (e: any) { toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: e.message }); } finally { setIsUpdating(false); setNewPassword(''); setConfirmPassword(''); } };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Alterar Senha de {seller?.displayName}</DialogTitle><DialogDescription>O utilizador será desconectado e precisará usar a nova senha.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="newPassword">Nova Senha</Label><Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirmar Nova Senha</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div></div>
                <DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar Nova Senha</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Sub-componente: Modal para Editar Pontos de um Vendedor ---
const EditPointsModal = ({ seller, isOpen, setIsOpen }: { seller: Seller | null; isOpen: boolean; setIsOpen: (open: boolean) => void; }) => {
    const { toast } = useToast();
    const [points, setPoints] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => { if (seller) setPoints(seller.points || 0); }, [seller]);
    const handleSavePoints = async (newPoints: number) => { if (!seller) return; setIsSubmitting(true); try { const func = httpsCallable(functions, 'updateSellerPoints'); await func({ uid: seller.id, points: newPoints }); toast({ title: 'Pontos Atualizados!' }); setIsOpen(false); } catch (e: any) { toast({ variant: 'destructive', title: 'Erro', description: e.message }); } finally { setIsSubmitting(false); } };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent><DialogHeader><DialogTitle>Editar Pontos de {seller?.name}</DialogTitle></DialogHeader><div className="py-4 space-y-4"><div className="space-y-2"><Label>Pontuação Base</Label><Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} /></div><Button variant="destructive" className="w-full" onClick={() => handleSavePoints(0)}>Zerar Pontuação</Button></div><DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={() => handleSavePoints(points)} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button></DialogFooter></DialogContent></Dialog>
    );
};

// --- Card de Perfil do Administrador ---
const AdminProfileCard = () => {
    const { toast } = useToast();
    const [adminUser, setAdminUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) { setAdminUser(user); setName(user.displayName || ''); setEmail(user.email || ''); }
        });
        return () => unsubscribe();
    }, []);

    const handleSaveChanges = async () => {
        if (!adminUser) return;
        setIsSaving(true);
        try {
            const updateAdminFunction = httpsCallable(functions, 'updateSeller');
            await updateAdminFunction({ uid: adminUser.uid, name, email });
            toast({ title: 'Perfil atualizado!' });
            setIsEditing(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!adminUser) return <Card><CardHeader><CardTitle>A carregar perfil...</CardTitle></CardHeader><CardContent><Loader2 className="animate-spin" /></CardContent></Card>;

    return (
        <>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="size-6" /> Meu Perfil de Administrador</CardTitle><CardDescription>Edite as suas informações de login e segurança.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} /></div>
                    <div className="flex justify-between items-center">
                        <div>
                            {!isEditing ? (<Button onClick={() => setIsEditing(true)}><Edit className="mr-2 size-4" /> Editar Perfil</Button>) : 
                            (<div className="flex gap-2"><Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button><Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button></div>)}
                        </div>
                        <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}><KeyRound className="mr-2 size-4"/> Alterar Senha</Button>
                    </div>
                </CardContent>
            </Card>
            {/* O modal de alterar senha é renderizado aqui, controlado pelo seu próprio estado */}
            <ChangePasswordModal seller={adminUser} isOpen={isPasswordModalOpen} setIsOpen={setIsPasswordModalOpen} />
        </>
    );
};

// --- Página Principal de Perfil ---
export default function PerfilPage() {
    const { sellers } = useAdminContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    const openModal = (type: 'edit' | 'password' | 'points', seller?: Seller) => {
        setSelectedSeller(seller || null);
        if (type === 'edit') setIsEditModalOpen(true);
        if (type === 'password' && seller) { setSelectedSeller(seller); setIsPasswordModalOpen(true); }
        if (type === 'points' && seller) { setSelectedSeller(seller); setIsPointsModalOpen(true); }
    };

    const handleSaveSeller = async (data: Partial<Seller>) => { /* ... (código anterior) */ };
    const handleDeleteSeller = async (seller: Seller) => { /* ... (código anterior) */ };

    return (
        <div className="space-y-8">
            <AdminProfileCard />
            <div className="flex justify-between items-center pt-8">
                <div className="flex items-center gap-4"><UserCog className="size-8 text-primary" /><h1 className="text-3xl font-bold">Gerir Vendedores</h1></div>
                <Button onClick={() => openModal('edit')}><PlusCircle className="mr-2 size-4" /> Adicionar Vendedor</Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Vendedores Registados</CardTitle><CardDescription>Adicione, edite e gira as permissões dos seus vendedores.</CardDescription></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead className="text-center">Pontos Totais</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {sellers.map(seller => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell>{seller.email}</TableCell>
                                        <TableCell className="text-center font-semibold">{(seller.points || 0) + (seller.extraPoints || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button title="Editar Pontos" variant="ghost" size="icon" onClick={() => openModal('points', seller)}><Star className="size-4 text-yellow-500" /></Button>
                                            <Button title="Editar Vendedor" variant="ghost" size="icon" onClick={() => openModal('edit', seller)}><Edit className="size-4" /></Button>
                                            <Button title="Alterar Senha" variant="ghost" size="icon" onClick={() => openModal('password', seller)}><KeyRound className="size-4" /></Button>
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
            <SellerFormModal isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} seller={selectedSeller} onSave={handleSaveSeller} />
            <ChangePasswordModal seller={selectedSeller} isOpen={isPasswordModalOpen} setIsOpen={setIsPasswordModalOpen} />
            <EditPointsModal seller={selectedSeller} isOpen={isPointsModalOpen} setIsOpen={setIsPointsModalOpen} />
        </div>
    );
}