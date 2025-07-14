'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function SignupPage() {

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm bg-card border-border">
        <CardHeader>
          <div className="flex justify-center mb-4"><Logo /></div>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <AlertTriangle className="text-destructive" />
            <span>Criação de Conta Desativada</span>
          </CardTitle>
          <CardDescription className="text-center pt-2">
            Por motivos de segurança, a criação de novas contas de administrador através desta página foi desativada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
                O utilizador administrador deve ser criado diretamente através do painel de autenticação do Firebase para garantir a segurança da plataforma.
            </p>
            <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  Voltar para o Login
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}