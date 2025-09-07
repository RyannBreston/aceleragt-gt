'use client';

import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Target } from 'lucide-react';

export default function SellerMissionsPage() {
  const { missions, isLoading } = useSellerContext();

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Target /> Missões Disponíveis
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission) => (
          <Card key={mission.id}>
            <CardHeader>
              <CardTitle>{mission.title}</CardTitle>
              <CardDescription>{mission.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-lg text-primary">{mission.points} Pontos</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}