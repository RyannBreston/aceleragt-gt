'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Logo} from '@/components/icons/logo';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {dataStore} from '@/lib/store';
import {Loader2} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { sendPasswordReset } from '@/ai/flows/send-password-reset-flow';

export default function LoginPage() {
  const router = useRouter();
  const {toast} = useToast();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const {adminUser, sellers} = dataStore.getState();

    // Check admin credentials
    if (
      login.toLowerCase() === adminUser.nickname &&
      password === adminUser.password
    ) {
      router.push('/admin');
      return;
    }

    // Check seller credentials
    const seller = sellers.find(
      s =>
        s.nickname?.toLowerCase() === login.toLowerCase() ||
        s.email?.toLowerCase() === login.toLowerCase()
    );

    if (seller && seller.password === password) {
      // Store the logged-in seller's ID to manage their session
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInSellerId', seller.id);
      }
      router.push('/seller');
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: 'Login ou senha inválidos. Por favor, tente novamente.',
      });
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
        toast({
            variant: 'destructive',
            title: 'Campo Obrigatório',
            description: 'Por favor, insira seu login ou email.',
        });
        return;
    }

    setIsSendingReset(true);

    try {
        const result = await sendPasswordReset({ identifier: resetIdentifier });
        if (result.success) {
            toast({
                title: 'Verifique seu Email',
                description: 'Se o usuário for um administrador, um email de recuperação foi enviado.',
            });
            setShowForgotDialog(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Falha na Recuperação',
                description: result.message,
            });
        }
    } catch (error) {
        console.error('Password reset error:', error);
        toast({
            variant: 'destructive',
            title: 'Erro no Sistema',
            description: 'Não foi possível processar sua solicitação. Tente novamente mais tarde.',
        });
    } finally {
        setIsSendingReset(false);
        setResetIdentifier('');
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="mx-auto max-w-sm bg-card border-border">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl text-center">Acessar Painel</CardTitle>
            <CardDescription className="text-center">
              Entre com seu e-mail ou nickname para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="login">Email ou Nickname</Label>
                  <Input
                    id="login"
                    type="text"
                    placeholder="seu@email.com ou nickname"
                    required
                    className="bg-input"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotDialog(true)}
                      className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
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
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              É um administrador? Use suas credenciais de acesso.
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <AlertDialogContent>
          <form onSubmit={handlePasswordReset}>
              <AlertDialogHeader>
                  <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
                  <AlertDialogDescription>
                      Para redefinir a senha de administrador, insira o login ou e-mail associado. As instruções serão enviadas de <span className="font-medium">super.moda@yahoo.com.br</span>.
                      <br/>
                      <span className='italic'>Vendedores devem contatar o administrador diretamente.</span>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                  <Label htmlFor="reset-identifier">Login ou Email do Administrador</Label>
                  <Input
                      id="reset-identifier"
                      placeholder="admin ou admin@email.com"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      disabled={isSendingReset}
                      className="mt-2"
                  />
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSendingReset}>Cancelar</AlertDialogCancel>
                  <Button type="submit" disabled={isSendingReset}>
                      {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar
                  </Button>
              </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
