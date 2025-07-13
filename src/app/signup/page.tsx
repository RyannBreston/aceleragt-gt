'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

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
    setIsLoading(true);

    if (adminCode !== ADMIN_CREATION_CODE) {
        toast({
            variant: 'destructive',
            title: 'Código de Administrador Inválido',
        });
        setIsLoading(false);
        return;
    }

    try {
      const q = query(collection(db, "users"), where("role", "==", "admin"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          toast({
              variant: 'destructive',
              title: 'Administrador já existe',
              description: 'Apenas uma conta de administrador pode ser criada.',
          });
          setIsLoading(false);
          return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name,
        email: user.email,
        role: 'admin',
      });

      toast({
        title: 'Conta de Administrador Criada!',
        description: 'Pode agora iniciar sessão com as suas novas credenciais.',
      });

      router.push('/login');

    } catch (error: any) {
      console.error("Erro de registo:", error);
      let description = 'Ocorreu um erro ao criar a sua conta.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está a ser utilizado por outra conta.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A sua senha é muito fraca. Por favor, escolha uma senha mais forte.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Registo',
        description: description,
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
          <CardTitle className="text-2xl text-center">Criar Conta de Administrador</CardTitle>
          <CardDescription className="text-center">
            Página para criação da conta principal de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
               <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="adminCode">Código de Administrador</Label>
                <Input id="adminCode" type="password" required value={adminCode} onChange={(e) => setAdminCode(e.target.value)} disabled={isLoading} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
               <Button variant="link" asChild>
                <Link href="/login">Já tem uma conta? Iniciar sessão</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
