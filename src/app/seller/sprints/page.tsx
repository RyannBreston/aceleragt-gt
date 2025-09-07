'use client';

import React from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Trophy } from 'lucide-react';

export default function SellerSprintsPage() {
  const { activeSprint, isLoading } = useSellerContext();

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Zap /> Corridinha Diária
      </h1>

      {activeSprint ? (
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <CardTitle>{activeSprint.title}</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Esta é a corridinha ativa do dia! Dê o seu melhor para alcançar os prémios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">Níveis de Prémio:</h3>
              <ul className="list-none space-y-2">
                {activeSprint.sprint_tiers.map((tier, index) => (
                  <li key={index} className="flex items-center gap-4 p-3 bg-primary/20 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-300" />
                    <div>
                      <p className="font-bold">Meta: {tier.goal}</p>
                      <p className="text-sm">Prémio: R$ {tier.prize.toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p>Nenhuma corridinha ativa para você no momento. Fique atento para a próxima!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}