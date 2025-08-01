'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Autenticar o utilizador com o Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Obter o documento do utilizador no Firestore para verificar a sua função (role)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // 3. Validar se o perfil do utilizador existe
      if (!userDoc.exists()) {
        // Se não existir, forçamos o logout para segurança e lançamos um erro.
        await auth.signOut();
        throw new Error('Perfil de utilizador não encontrado.');
      }

      // 4. Determinar o 'role' e redirecionar para o painel correto
      const userData = userDoc.data();
      const role = userData?.role;

      if (role === 'admin') {
        router.push('/admin/dashboard'); // Redireciona para o dashboard do admin
      } else if (role === 'seller') {
        // O localStorage não é mais necessário. A autenticação é gerida pelo onAuthStateChanged.
        router.push('/seller/dashboard'); // Redireciona para o dashboard do vendedor
      } else {
        // Se o 'role' for inválido ou não existir, forçamos o logout e lançamos um erro.
        await auth.signOut();
        throw new Error('Perfil de utilizador inválido ou não autorizado.');
      }

    } catch (error: any) {
      // 5. Tratamento de erros centralizado
      let errorMessage = 'Ocorreu um erro ao tentar entrar.';

      // Mapeia códigos de erro do Firebase para mensagens amigáveis
      if (error.code?.includes('auth/')) {
        errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      } else if (error.message) {
        // Usa a mensagem de erro personalizada (ex: "Perfil não encontrado")
        errorMessage = error.message;
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
          <CardTitle className="text-2xl text-center">Aceder ao Painel</CardTitle>
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
          {/* O link para signup pode ser removido se você já apagou a página de signup */}
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
              Criado por Rian
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}