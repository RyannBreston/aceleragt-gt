'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Github } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Perfil de utilizador não encontrado.");
      }
      
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'seller') {
        localStorage.setItem('loggedInSellerId', user.uid);
        router.push('/seller');
      } else {
        throw new Error("O seu perfil não tem um papel de utilizador válido.");
      }

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      const authErrorCodes = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];
      if (authErrorCodes.includes(error.code)) {
        errorMessage = 'Email ou senha inválidos.';
      } else if (error.message.includes("Firestore")) {
        errorMessage = error.message;
      }
      toast({ variant: 'destructive', title: 'Falha no Login', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm bg-card border-border">
        <CardHeader>
          <div className="flex justify-center mb-4"><Logo /></div>
          <CardTitle className="text-2xl text-center">Aceder ao Painel</CardTitle>
          <CardDescription className="text-center">Entre com o seu e-mail e senha para aceder.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} /></div>
              <div className="grid gap-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} /></div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar</Button>
            </div>
          </form>
           {/* --- LINK ADICIONADO AQUI --- */}
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline">
                Criar conta de Administrador
              </Link>
            </div>
           {/* --- FIM DO LINK --- */}
        </CardContent>
        <CardFooter>
            <div className="text-center text-xs text-muted-foreground w-full">
                <a href="https://github.com/RyannBreston" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Github className="size-3" />
                    Criado por Rian
                </a>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}