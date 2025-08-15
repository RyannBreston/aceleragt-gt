'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, UserPlus, Shield, KeyRound, Trash2, Edit } from 'lucide-react';
import { Seller, Admin } from '@/lib/types';

// Modal para CRIAR um novo vendedor
const CreateSellerModal = ({ onSellerCreated }: { onSellerCreated: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { setIsDirty } = useAdminContext();

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const createSellerFunc = httpsCallable(functions, 'api');
            await createSellerFunc({ action: 'createSeller', name, email, password });
            toast({ title: "Sucesso", description: "Vendedor criado com sucesso." });
            setIsDirty(true); // Marca que os dados precisam ser recarregados
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
                <Input type="password" placeholder="Senha Inicial" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button>
        </DialogContent>
    );
};

// Modal para EDITAR um vendedor existente
const EditSellerModal = ({ seller, onSellerUpdated }: { seller: Seller, onSellerUpdated: () => void }) => {
    const [name, setName] = useState(seller.name);
    const [email, setEmail] = useState(seller.email);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { setIsDirty } = useAdminContext();

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const updateSellerFunc = httpsCallable(functions, 'api');
            await updateSellerFunc({ action: 'updateSeller', uid: seller.id, name, email });
            toast({ title: "Sucesso", description: "Dados do vendedor atualizados." });
            setIsDirty(true);
            onSellerUpdated();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Vendedor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações</Button>
        </DialogContent>
    );
};


// Modal para ALTERAR SENHA de qualquer usuário
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

// Componente Card para exibir informações e ações de um vendedor
const SellerCard = ({ seller, onEdit, onChangePassword, onDelete }: { seller: Seller, onEdit: () => void, onChangePassword: () => void, onDelete: () => void }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">{seller.name}</CardTitle>
                    <CardDescription>{seller.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={onEdit} title="Editar"><Edit className="size-4" /></Button>
                    <Button size="icon" variant="outline" onClick={onChangePassword} title="Alterar Senha"><KeyRound className="size-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={onDelete} title="Excluir"><Trash2 className="size-4" /></Button>
                </div>
            </CardHeader>
        </Card>
    );
};


export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers, admin, setIsDirty } = useAdminContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Seller | Admin | null>(null);

    const handleDelete = async (user: Seller) => {
        if (!confirm(`Tem certeza que deseja excluir o vendedor ${user.name}? Esta ação não pode ser desfeita.`)) return;
        try {
            const deleteFunc = httpsCallable(functions, 'api');
            await deleteFunc({ action: 'deleteSeller', uid: user.id });
            toast({ title: "Sucesso", description: "Vendedor excluído." });
            setIsDirty(true); // Marca que os dados precisam ser recarregados
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2" />Adicionar Vendedor</Button>
                    </DialogTrigger>
                    <CreateSellerModal onSellerCreated={() => setIsCreateModalOpen(false)} />
                </Dialog>
            </div>
            
            {/* Modals reutilizáveis */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                {selectedUser && 'salesValue' in selectedUser && <EditSellerModal seller={selectedUser} onSellerUpdated={() => setIsEditModalOpen(false)} />}
            </Dialog>
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                {selectedUser && <PasswordModal user={selectedUser} onPasswordChanged={() => setIsPasswordModalOpen(false)} />}
            </Dialog>

            <div className="grid gap-6">
                {/* Card do Admin */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield /> Administrador</CardTitle></CardHeader>
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
                
                {/* Seção dos Vendedores */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Vendedores</h2>
                    <div className="space-y-4">
                        {sellers.map(seller => (
                            <SellerCard 
                                key={seller.id} 
                                seller={seller}
                                onEdit={() => { setSelectedUser(seller); setIsEditModalOpen(true); }}
                                onChangePassword={() => { setSelectedUser({ ...seller, role: 'seller' }); setIsPasswordModalOpen(true); }}
                                onDelete={() => handleDelete(seller)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
