'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Github } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Autenticar o utilizador
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Obter o documento do utilizador no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // 3. Validar se o perfil do utilizador existe
      if (!userDoc.exists()) {
        await auth.signOut();
        throw new Error('Perfil de utilizador não encontrado.');
      }

      // 4. Determinar a função e redirecionar
      const userData = userDoc.data();
      const role = userData?.role;

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'seller') {
        router.push('/seller/dashboard');
      } else {
        await auth.signOut();
        throw new Error('Perfil de utilizador inválido ou não autorizado.');
      }

    } catch (error: unknown) {
      // 5. Tratamento de erros aprimorado
      let errorMessage = 'Ocorreu um erro ao tentar entrar.';
      
      if (error instanceof Error) {
        // Verifica se é um erro de autenticação do Firebase
        const firebaseError = error as AuthError;
        if (firebaseError.code && firebaseError.code.startsWith('auth/')) {
          errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
        } else {
          // Usa a mensagem de erro personalizada (ex: "Perfil não encontrado")
          errorMessage = error.message;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full bg-card border-border">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">bem-vindo ao app da SuperModa</CardTitle>
          <CardDescription className="text-center">
            Entre com o seu e-mail e senha para aceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline">
              Criar conta de Administrador
            </Link>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-center text-xs text-muted-foreground w-full">
            <a
              href="https://github.com/RyannBreston"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Github className="size-3" />
              developed by RyannBreston and luciano medrado
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}