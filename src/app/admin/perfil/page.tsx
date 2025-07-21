'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, PlusCircle, Loader2, Trash2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/contexts/AdminContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller } from "@/lib/types";

// --- Componente do Modal de Alteração de Senha ---
const ChangePasswordDialog = ({ seller }: { seller: Seller }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Senha muito curta", description: "A nova senha deve ter no mínimo 6 caracteres." });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "As senhas não coincidem" });
            return;
        }

        setIsChanging(true);
        try {
            const changePasswordFunction = httpsCallable(functions, 'changeSellerPassword');
            await changePasswordFunction({ uid: seller.id, newPassword: newPassword });
            toast({ title: 'Senha Alterada!', description: `A senha de ${seller.name} foi atualizada.` });
            setIsOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Erro ao alterar senha:", error);
            toast({ variant: 'destructive', title: 'Erro ao Alterar Senha', description: error.message });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label={`Alterar senha de ${seller.name}`}>
                    <KeyRound className="h-4 w-4 text-secondary" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Senha de {seller.name}</DialogTitle>
                    <DialogDescription>Digite a nova senha para o vendedor. Ele será desconectado e precisará usar a nova senha para entrar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword} disabled={isChanging}>
                        {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Nova Senha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};

// --- Componente Principal da Página ---
export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers, isAuthReady } = useAdminContext();
    
    const [newSeller, setNewSeller] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeller.name.trim() || !newSeller.email.trim() || !newSeller.password.trim()) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios' });
            return;
        }

        if (newSeller.password.length < 6) {
            toast({
                variant: "destructive",
                title: "Senha Muito Curta",
                description: "A senha deve ter no mínimo 6 caracteres.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const createSellerFunction = httpsCallable(functions, 'createSeller');
            await createSellerFunction({
                email: newSeller.email,
                password: newSeller.password,
                name: newSeller.name,
            });

            toast({
                title: 'Vendedor Adicionado!',
                description: `A conta para ${newSeller.name} foi criada com sucesso.`,
            });
            setNewSeller({ name: '', email: '', password: '' });

        } catch (error: any) {
            console.error("Erro ao adicionar vendedor:", error);
            toast({ variant: 'destructive', title: 'Falha no Registo', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSeller = async (sellerId: string, sellerName: string) => {
        if (window.confirm(`Tem a certeza que deseja apagar ${sellerName}? Esta ação é irreversível e irá apagar a conta de login e todos os dados do vendedor.`)) {
             try {
                const deleteSellerFunction = httpsCallable(functions, 'deleteSeller');
                await deleteSellerFunction({ uid: sellerId });

                toast({ title: 'Vendedor Apagado', description: `${sellerName} foi removido com sucesso.` });
            } catch (error: any) {
                console.error("Erro ao apagar vendedor: ", error);
                toast({ variant: 'destructive', title: 'Erro ao Apagar', description: error.message });
            }
        }
    };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserCog className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Gerir Vendedores</h1>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PlusCircle className="size-6" />
                <span>Adicionar Novo Vendedor</span>
            </CardTitle>
            <CardDescription>Crie uma nova conta de login para um vendedor.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleAddSeller} className="space-y-4">
                 <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sellerName">Nome Completo</Label>
                        <Input id="sellerName" placeholder="Nome do Vendedor" value={newSeller.name} onChange={(e) => setNewSeller(s => ({...s, name: e.target.value}))} required disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellerEmail">Email de Login</Label>
                        <Input id="sellerEmail" type="email" placeholder="email@vendedor.com" value={newSeller.email} onChange={(e) => setNewSeller(s => ({...s, email: e.target.value}))} required disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellerPassword">Senha Inicial</Label>
                        <Input id="sellerPassword" type="text" placeholder="Mínimo 6 caracteres" value={newSeller.password} onChange={(e) => setNewSeller(s => ({...s, password: e.target.value}))} required disabled={isLoading} />
                    </div>
                 </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar Vendedor
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
            <CardTitle>Vendedores Registados</CardTitle>
            <CardDescription>Lista de todos os vendedores com contas na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sellers.length > 0 ? sellers.map(seller => (
                            <TableRow key={seller.id}>
                                <TableCell className="font-medium">{seller.name}</TableCell>
                                <TableCell>{seller.email}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <ChangePasswordDialog seller={seller} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSeller(seller.id, seller.name)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    {isAuthReady ? "Nenhum vendedor registado." : <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
