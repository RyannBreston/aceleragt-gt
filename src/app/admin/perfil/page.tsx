'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Users, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "../layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
            // Criar utilizador no Firebase Auth
            // NOTA: Esta abordagem cria um utilizador temporário no cliente.
            // Para produção, o ideal seria usar uma Cloud Function para criar utilizadores.
            const userCredential = await createUserWithEmailAndPassword(auth, newSeller.email, newSeller.password);
            const user = userCredential.user;

            // Criar documento do vendedor no Firestore
            const sellerDocRef = doc(db, 'sellers', user.uid);
            await setDoc(sellerDocRef, {
                id: user.uid,
                name: newSeller.name,
                email: newSeller.email,
                role: 'seller',
                salesValue: 0,
                ticketAverage: 0,
                pa: 0,
                points: 0,
                extraPoints: 0,
                completedCourseIds: [],
                workSchedule: {},
            });

            // Criar documento de papel para o vendedor
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                role: 'seller'
            });

            toast({
                title: 'Vendedor Adicionado!',
                description: `A conta para ${newSeller.name} foi criada com sucesso.`,
            });
            setNewSeller({ name: '', email: '', password: '' });

        } catch (error: any) {
            console.error("Erro ao adicionar vendedor:", error);
            let description = 'Ocorreu um erro ao criar o vendedor.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Este e-mail já está a ser utilizado.';
            }
            toast({ variant: 'destructive', title: 'Falha no Registo', description });
        } finally {
            setIsLoading(false);
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sellers.length > 0 ? sellers.map(seller => (
                            <TableRow key={seller.id}>
                                <TableCell className="font-medium">{seller.name}</TableCell>
                                <TableCell>{seller.email}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
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
