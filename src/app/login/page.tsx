'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
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

      // Após o login, verificar o papel do utilizador na coleção 'users'
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Perfil de utilizador não encontrado no Firestore. A conta de login existe, mas os dados do perfil não. Contacte o administrador.");
      }
      
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        // Limpar qualquer ID de vendedor de sessões anteriores
        localStorage.removeItem('loggedInSellerId');
        router.push('/admin');
      } else if (userData.role === 'seller') {
        // Definir o ID do vendedor no localStorage para que o layout do vendedor o possa encontrar
        localStorage.setItem('loggedInSellerId', user.uid);
        router.push('/seller');
      } else {
        throw new Error("O seu perfil não tem um papel de utilizador válido (admin/seller).");
      }

    } catch (error: any) {
      console.error("Erro de login:", error);
      let errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      if (error.message.includes("Firestore")) {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: errorMessage,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm bg-card border-border">
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
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Criar Conta de Administrador
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
