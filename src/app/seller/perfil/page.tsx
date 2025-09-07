'use client';

import React from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PerfilPage() {
  const { currentSeller, isLoading } = useSellerContext();

  if (isLoading || !currentSeller) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User /> Meu Perfil
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{currentSeller.name}</CardTitle>
          <CardDescription>{currentSeller.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            A funcionalidade para editar o perfil e alterar a senha será implementada aqui, utilizando a nova arquitetura.
          </p>
          <Button disabled>Alterar Senha (Em Breve)</Button>
        </CardContent>
      </Card>
    </div>
  );
}