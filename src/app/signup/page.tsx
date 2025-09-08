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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CREATION_CODE = 'SUPERMODA_ADMIN_2024';

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('seller'); // Default role is 'seller'
    const [adminCode, setAdminCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();

        if (role === 'admin' && adminCode.trim() !== ADMIN_CREATION_CODE) {
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
                body: JSON.stringify({ name, email, password, role }), // Send the role to the API
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar a conta.');
            }

            toast({ title: 'Conta criada com sucesso!', description: `Usuário ${data.user.name} (${data.user.role}) foi criado.` });
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
                    <CardTitle className="text-2xl text-center">Criar Nova Conta</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">Insira as informações para registrar um novo usuário.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" placeholder="Nome do usuário" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="usuario@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Função</Label>
                            <Select onValueChange={setRole} defaultValue={role} disabled={isLoading}>
                                <SelectTrigger id="role"><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="seller">Vendedor</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {role === 'admin' && (
                            <div className="grid gap-2">
                                <Label htmlFor="admin-code">Código de Administrador</Label>
                                <Input id="admin-code" type="password" placeholder="Código secreto para admin" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required disabled={isLoading} />
                            </div>
                        )}
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