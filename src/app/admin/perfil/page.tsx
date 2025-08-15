'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, UserPlus, Shield, KeyRound, Trash2 } from 'lucide-react';
import { Seller } from '@/lib/types';

const CreateSellerModal = ({ onSellerCreated }: { onSellerCreated: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const createSellerFunc = httpsCallable(functions, 'api');
            await createSellerFunc({ action: 'createSeller', name, email, password });
            toast({ title: "Sucesso", description: "Vendedor criado com sucesso." });
            onSellerCreated();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Vendedor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button>
        </DialogContent>
    );
};

const PasswordModal = ({ user, onPasswordChanged }: { user: { id: string, name: string, role: 'admin' | 'seller' }, onPasswordChanged: () => void }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleChangePassword = async () => {
        setIsLoading(true);
        try {
            const action = user.role === 'admin' ? 'changeAdminPassword' : 'changeSellerPassword';
            const changePasswordFunc = httpsCallable(functions, 'api');
            await changePasswordFunc({ action, uid: user.id, newPassword: password });
            toast({ title: "Sucesso", description: "Senha alterada com sucesso." });
            onPasswordChanged();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Alterar Senha de {user.name}</DialogTitle></DialogHeader>
            <Input type="password" placeholder="Nova Senha" value={password} onChange={e => setPassword(e.target.value)} />
            <Button onClick={handleChangePassword} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Alterar</Button>
        </DialogContent>
    );
};


export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers, admin } = useAdminContext();
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, role: 'admin' | 'seller' } | null>(null);

    const handleDelete = async (user: Seller) => {
        try {
            const deleteFunc = httpsCallable(functions, 'api');
            await deleteFunc({ action: 'deleteSeller', uid: user.id });
            toast({ title: "Sucesso", description: "Vendedor excluído." });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
            <Dialog open={isSellerModalOpen} onOpenChange={setIsSellerModalOpen}>
                <DialogTrigger asChild>
                    <Button><UserPlus className="mr-2" />Adicionar Vendedor</Button>
                </DialogTrigger>
                <CreateSellerModal onSellerCreated={() => setIsSellerModalOpen(false)} />
            </Dialog>
            
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                {selectedUser && <PasswordModal user={selectedUser} onPasswordChanged={() => setIsPasswordModalOpen(false)} />}
            </Dialog>

            <div className="grid gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield /> Administradores</CardTitle></CardHeader>
                    <CardContent>
                        {admin && (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{admin.name}</p>
                                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(admin); setIsPasswordModalOpen(true) }}><KeyRound className="mr-2 size-4" />Alterar Senha</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Vendedores</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {sellers.map(seller => (
                            <div key={seller.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{seller.name}</p>
                                    <p className="text-sm text-muted-foreground">{seller.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(seller); setIsPasswordModalOpen(true) }}><KeyRound className="mr-2 size-4" />Senha</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(seller)}><Trash2 className="size-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
