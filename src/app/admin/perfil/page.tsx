'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PerfilAdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Perfil de Administrador</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User />
            {user.name}
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
            <p>A funcionalidade para editar o perfil e alterar a senha será implementada aqui.</p>
            <Button disabled className="mt-4">Alterar Senha (Em Breve)</Button>
        </CardContent>
      </Card>
    </div>
  );
}