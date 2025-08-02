'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, PlusCircle, Loader2, Trash2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/contexts/AdminContext";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import type { Seller } from "@/lib/types";
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// --- Componente do Modal de Alteração de Senha (Sem alterações) ---
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
      await changePasswordFunction({ uid: seller.id, newPassword });
      toast({ title: 'Senha Alterada!', description: `A senha de ${seller.name} foi atualizada.` });
      setIsOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
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
          <DialogDescription>
            Digite a nova senha para o vendedor. Ele será desconectado e precisará usar a nova senha para entrar.
          </DialogDescription>
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
  );
};

// --- Componente AlertDialog para confirmar a exclusão (Sem alterações) ---
const DeleteSellerDialog = ({ seller, onDelete }: { seller: Seller, onDelete: (sellerId: string, sellerName: string) => void }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(seller.id, seller.name);
    setIsDeleting(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Apagar ${seller.name}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isto irá apagar permanentemente a conta de <span className="font-bold">{seller.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, apagar vendedor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Componente Principal da Página ---
export default function PerfilPage() {
  const { toast } = useToast();
  const { sellers, isAuthReady } = useAdminContext();
  const [newSeller, setNewSeller] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * VERSÃO DE TESTE DA FUNÇÃO handleAddSeller
   * Esta função ignora os dados do formulário e envia dados fixos
   * para a Cloud Function para isolar a causa do erro.
   */
  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Dados de teste fixos para garantir que a requisição é válida.
    const testData = {
      name: "Teste de Vendedor",
      email: `teste-${Date.now()}@teste.com`, // Email único para cada teste
      password: "senhaSegura123"
    };

    console.log("A ENVIAR DADOS DE TESTE FIXOS:", testData);

    try {
      // Cria a referência para a função chamável
      const createSellerFunction = httpsCallable(functions, 'createSeller');

      // Executa a função com os dados de teste
      await createSellerFunction(testData);
      
      toast({ 
        title: 'TESTE BEM-SUCEDIDO!', 
        description: `O vendedor de teste foi criado com sucesso.` 
      });
      
      // Limpa o formulário real
      setNewSeller({ name: '', email: '', password: '' });

    } catch (error: any) {
      // Se ainda der erro, será um erro do backend (ex: permissões)
      toast({ 
        variant: 'destructive', 
        title: 'TESTE FALHOU', 
        description: `Erro: ${error.message}` 
      });
      console.error("ERRO NO TESTE:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSeller = async (sellerId: string, sellerName: string) => {
    try {
      const deleteSellerFunction = httpsCallable(functions, 'deleteSeller');
      await deleteSellerFunction({ uid: sellerId });
      toast({
        title: 'Vendedor Apagado',
        description: `${sellerName} foi removido com sucesso.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Apagar',
        description: error.message
      });
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
          {/* O formulário ainda é renderizado, mas a sua submissão usará os dados de teste */}
          <form onSubmit={handleAddSeller} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName">Nome Completo</Label>
                <Input id="sellerName" placeholder="Nome do Vendedor" value={newSeller.name} onChange={(e) => setNewSeller(s => ({ ...s, name: e.target.value }))} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Email de Login</Label>
                <Input id="sellerEmail" type="email" placeholder="email@vendedor.com" value={newSeller.email} onChange={(e) => setNewSeller(s => ({ ...s, email: e.target.value }))} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerPassword">Senha Inicial</Label>
                <Input
                  id="sellerPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newSeller.password}
                  onChange={(e) => setNewSeller(s => ({ ...s, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Vendedor (Modo de Teste)
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
                      <DeleteSellerDialog seller={seller} onDelete={handleDeleteSeller} />
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