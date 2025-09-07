'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react'; // Importa o signIn
import { Loader2, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

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
            const result = await signIn('credentials', {
                redirect: false, // Não redireciona automaticamente
                email,
                password,
            });

            if (result?.error) {
                throw new Error('Email ou senha inválidos.');
            }

            // O redirecionamento será tratado pelo middleware ou por um useEffect na página de destino
            // Por enquanto, vamos forçar um reload para que o NextAuth atualize o estado
            router.refresh();
            router.push('/'); // Redireciona para a home, que decidirá para onde ir

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao tentar entrar.';
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
        <div className="flex items-center justify-center min-h-screen">
            <Card className="mx-auto max-w-sm w-full bg-card border-border">
                <CardHeader>
                    <div className="flex justify-center mb-4"><Logo /></div>
                    <CardTitle className="text-2xl text-center">bem-vindo(a) ao aceleraGT </CardTitle>
                    <CardDescription className="text-center">Entre com o seu e-mail e senha para aceder.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-4">
                        {/* Inputs para email e password (mantidos como antes) */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Não tem uma conta?{' '}
                        <Link href="/signup" className="underline">Criar conta de Administrador</Link>
                    </div>
                </CardContent>
                <CardFooter>
                    {/* Footer mantido como antes */}
                     <div className="text-center text-xs text-muted-foreground w-full">
                        <a
                            href="https://github.com/RyannBreston"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                            <Github className="size-3" />
                            developed by RyannBreston
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}