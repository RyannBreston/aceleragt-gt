'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

// Este é o código secreto para criar uma conta de administrador.
// ATENÇÃO: Em produção, o ideal é remover esta página e criar o primeiro admin
// manualmente pelo painel do Firebase para máxima segurança.
const ADMIN_CREATION_CODE = "SUPERMODA_ADMIN_2024";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode.trim() !== ADMIN_CREATION_CODE) {
        toast({
            variant: 'destructive',
            title: 'Código de Administrador Inválido',
            description: 'O código inserido está incorreto. Apenas administradores podem criar contas.',
        });
        return;
    }

    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Senha Muito Curta",
            description: "A senha deve ter no mínimo 6 caracteres.",
        });
        return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Adiciona o papel de admin na coleção 'users' do Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        role: 'admin',
        email: email,
        name: name,
      });

      toast({
        title: 'Conta de Administrador Criada!',
        description: 'Você já pode fazer o login com as suas novas credenciais.',
      });
      router.push('/login');

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro ao criar a conta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está a ser utilizado por outra conta.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Registo',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm bg-card border-border">
        <CardHeader>
          <div className="flex justify-center mb-4"><Logo /></div>
          <CardTitle className="text-2xl text-center">Criar Conta de Admin</CardTitle>
          <CardDescription className="text-center">
            Esta página é apenas para a criação de novos administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="Seu nome" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="admin-code">Código de Administrador</Label>
              <Input id="admin-code" type="password" required value={adminCode} onChange={e => setAdminCode(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <div className="text-center text-sm text-muted-foreground w-full">
                Já tem uma conta?{' '}
                <Link href="/login" className="underline hover:text-primary">
                    Fazer Login
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}