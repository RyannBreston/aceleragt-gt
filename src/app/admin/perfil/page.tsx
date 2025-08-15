'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, UserPlus, Shield, KeyRound, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Tipagem para os usuários que virão do backend
interface AuthUser {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'seller' | 'unknown';
}

// Modal para CRIAR um novo vendedor
const CreateSellerModal = ({ onUserCreated }: { onUserCreated: () => void }) => {
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
            onUserCreated();
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

// Modal para EDITAR um usuário existente
const EditUserModal = ({ user, onUserUpdated }: { user: AuthUser, onUserUpdated: () => void }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const action = user.role === 'admin' ? 'updateAdmin' : 'updateSeller';
            const updateUserFunc = httpsCallable(functions, 'api');
            await updateUserFunc({ action, uid: user.uid, name, email });
            toast({ title: "Sucesso", description: "Dados do usuário atualizados." });
            onUserUpdated();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações</Button>
        </DialogContent>
    );
};


// Modal para ALTERAR SENHA de qualquer usuário
const PasswordModal = ({ user, onPasswordChanged }: { user: AuthUser, onPasswordChanged: () => void }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleChangePassword = async () => {
        setIsLoading(true);
        try {
            const action = user.role === 'admin' ? 'changeAdminPassword' : 'changeSellerPassword';
            const changePasswordFunc = httpsCallable(functions, 'api');
            await changePasswordFunc({ action, uid: user.uid, newPassword: password });
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

// Componente Card para exibir informações e ações de um usuário
const UserCard = ({ user, onEdit, onChangePassword, onDelete }: { user: AuthUser, onEdit: () => void, onChangePassword: () => void, onDelete: () => void }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">{user.name || <span className="italic text-muted-foreground">Usuário sem nome</span>}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={onEdit} title="Editar"><Edit className="size-4" /></Button>
                    <Button size="icon" variant="outline" onClick={onChangePassword} title="Alterar Senha"><KeyRound className="size-4" /></Button>
                    {user.role === 'seller' && <Button size="icon" variant="destructive" onClick={onDelete} title="Excluir"><Trash2 className="size-4" /></Button>}
                </div>
            </CardHeader>
        </Card>
    );
};


export default function PerfilPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const listUsersFunc = httpsCallable(functions, 'api');
            const result = await listUsersFunc({ action: 'listAllUsers' });
            setUsers(result.data as AuthUser[]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha ao carregar usuários.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (user: AuthUser) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name || user.email}? Esta ação não pode ser desfeita.`)) return;
        try {
            const deleteFunc = httpsCallable(functions, 'api');
            // A função de backend 'deleteSeller' já apaga o usuário do Auth e do Firestore.
            await deleteFunc({ action: 'deleteSeller', uid: user.uid });
            toast({ title: "Sucesso", description: "Vendedor excluído." });
            fetchUsers(); // Recarrega a lista após a exclusão
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: "destructive", title: "Erro", description: errorMessage });
        }
    };

    const admins = users.filter(u => u.role === 'admin');
    const sellers = users.filter(u => u.role === 'seller');

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2" />Adicionar Vendedor</Button>
                    </DialogTrigger>
                    <CreateSellerModal onUserCreated={() => { setIsCreateModalOpen(false); fetchUsers(); }} />
                </Dialog>
            </div>
            
            {/* Modals reutilizáveis */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                {selectedUser && <EditUserModal user={selectedUser} onUserUpdated={() => { setIsEditModalOpen(false); fetchUsers(); }} />}
            </Dialog>
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                {selectedUser && <PasswordModal user={selectedUser} onPasswordChanged={() => setIsPasswordModalOpen(false)} />}
            </Dialog>

            <div className="grid gap-6">
                {/* Seção dos Admins */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield /> Administradores</h2>
                    {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                         </div>
                    ) : (
                        <div className="space-y-4">
                            {admins.map(user => (
                                <UserCard 
                                    key={user.uid} 
                                    user={user}
                                    onEdit={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                    onChangePassword={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
                                    onDelete={() => {}} // Admin não pode ser excluído por esta interface
                                />
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Seção dos Vendedores */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Vendedores</h2>
                     {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                         </div>
                    ) : (
                        <div className="space-y-4">
                            {sellers.map(user => (
                                <UserCard 
                                    key={user.uid} 
                                    user={user}
                                    onEdit={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                    onChangePassword={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
                                    onDelete={() => handleDelete(user)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
