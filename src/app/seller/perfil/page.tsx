'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, KeyRound, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSellerContext } from '@/contexts/SellerContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { auth } from '@/lib/firebase';

export default function SellerProfilePage() {
  const { currentSeller } = useSellerContext();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A nova senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "As senhas não coincidem" });
      return;
    }
    if (!currentSeller) {
      toast({ variant: "destructive", title: "Erro", description: "Utilizador não encontrado." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const changePasswordFunction = httpsCallable(functions, 'changeSellerPassword');
      await changePasswordFunction({
        uid: currentSeller.id,
        newPassword: newPassword
      });

      toast({ title: 'Senha atualizada com sucesso!', description: 'Você será desconectado e precisará de fazer login com a nova senha.' });
      
      setNewPassword('');
      setConfirmPassword('');
      setIsModalOpen(false);
      
      await auth.signOut();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: errorMessage,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!currentSeller) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <User className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentSeller.name}</CardTitle>
          <CardDescription>As suas informações de perfil e segurança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={currentSeller.email} disabled />
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <KeyRound className="mr-2 size-4" />
                Alterar Senha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar a sua Senha</DialogTitle>
                <DialogDescription>
                  Digite e confirme a sua nova senha. Você será desconectado de todos os dispositivos após a alteração.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Salvar Nova Senha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </div>
  );
}