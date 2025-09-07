/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CREATION_CODE = 'SUPERMODA_ADMIN_2024';

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();

        if (adminCode.trim() !== ADMIN_CREATION_CODE) {
            toast({ variant: 'destructive', title: 'Código inválido', description: 'O código de administrador inserido está incorreto.' });
            return;
        }

        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha precisa ter pelo menos 6 caracteres.' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar a conta.');
            }

            toast({ title: 'Conta criada com sucesso!', description: 'Você já pode fazer login como administrador.' });
            router.push('/login');

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
            toast({ variant: 'destructive', title: 'Falha ao registrar', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="mx-auto max-w-sm w-full bg-card border-border">
                <CardHeader>
                    <div className="flex justify-center mb-4"><Logo /></div>
                    <CardTitle className="text-2xl text-center">Criar Conta de Admin</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">Insira suas informações e o código secreto para registrar um novo administrador.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="grid gap-4">
                        {/* Inputs para name, email, password, admin-code (mantidos como antes) */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin-code">Código de Administrador</Label>
                            <Input id="admin-code" type="password" placeholder="Código secreto" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required disabled={isLoading} />
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
                        <Link href="/login" className="underline hover:text-primary">Fazer login</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}