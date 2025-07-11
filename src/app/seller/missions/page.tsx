'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star, CheckCircle } from 'lucide-react';
import { useSellerContext } from '@/app/seller/layout';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Mission } from '@/lib/types';

export default function MissionsPage() {
  const { missions } = useSellerContext();

  // In a real app, you would have logic to determine if a mission is completed by the user
  const getMissionStatus = (missionId: string) => {
    // Dummy logic for prototype
    if (missionId === '3') return { label: 'Concluída', icon: <CheckCircle className="size-4 text-green-500" />, completed: true };
    return { label: 'Ativa', icon: null, completed: false };
  };

  const formatReward = (mission: Mission) => {
    if (mission.rewardType === 'cash') {
      return mission.rewardValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return `${mission.rewardValue} pts`;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Target className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Minhas Missões</h1>
      </div>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Missões Disponíveis</CardTitle>
          <CardDescription>
            Complete os desafios abaixo para ganhar pontos extras e subir no ranking!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missions.length > 0 ? (
             <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Missão</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Recompensa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission) => {
                    const status = getMissionStatus(mission.id);
                    return (
                        <TableRow key={mission.id} className={status.completed ? 'text-muted-foreground' : ''}>
                        <TableCell className="font-medium">{mission.name}</TableCell>
                        <TableCell>{format(mission.startDate, 'dd/MM/yy')} - {format(mission.endDate, 'dd/MM/yy')}</TableCell>
                        <TableCell className="text-center font-semibold text-primary">{formatReward(mission)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={status.completed ? 'secondary' : 'default'} className="flex items-center justify-center gap-2">
                                {status.icon}
                                <span>{status.label}</span>
                            </Badge>
                        </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">Nenhuma missão disponível</p>
              <p className="text-sm">
                Volte em breve para novos desafios.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
