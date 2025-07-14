'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle, Award, Loader2 } from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext'; // Caminho de importação corrigido
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function MissionsPage() {
  const { currentSeller, setSellers } = useSellerContext();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const missionsCollectionPath = `artifacts/${appId}/public/data/missions`;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, missionsCollectionPath), (snapshot) => {
        const missionsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            startDate: d.data().startDate?.toDate(),
            endDate: d.data().endDate?.toDate(),
        } as Mission));
        setMissions(missionsData);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [missionsCollectionPath]);

  const handleClaimReward = async (mission: Mission) => {
      if (!currentSeller) return;
      setClaiming(mission.id);

      try {
          const sellerRef = doc(db, 'sellers', currentSeller.id);
          const missionRef = doc(db, missionsCollectionPath, mission.id);

          // Atualiza o vendedor
          if (mission.rewardType === 'points') {
              await updateDoc(sellerRef, {
                  points: (currentSeller.points || 0) + mission.rewardValue
              });
          } else {
             // Lógica para prémios em dinheiro pode ser mais complexa (ex: notificação para admin)
             // Por agora, vamos adicionar como pontos extras como exemplo.
              await updateDoc(sellerRef, {
                  extraPoints: (currentSeller.extraPoints || 0) + mission.rewardValue
              });
          }
          
          // Marca a missão como concluída para este utilizador
          await updateDoc(missionRef, {
              completedBy: arrayUnion(currentSeller.id)
          });

          // Atualiza o estado local
          setSellers(prev => prev.map(s => {
              if (s.id !== currentSeller.id) return s;
              if (mission.rewardType === 'points') {
                  return { ...s, points: (s.points || 0) + mission.rewardValue };
              }
              return { ...s, extraPoints: (s.extraPoints || 0) + mission.rewardValue };
          }));
          
          toast({ title: 'Recompensa Resgatada!', description: `Você ganhou: ${formatReward(mission)}`});
      } catch (error) {
          console.error("Erro ao resgatar recompensa:", error);
          toast({ variant: 'destructive', title: 'Erro ao resgatar.' });
      } finally {
          setClaiming(null);
      }
  };

  const getMissionStatus = (mission: Mission) => {
    if (!currentSeller) return { label: 'Ativa', completed: false, canClaim: false };
    
    const hasCompleted = mission.completedBy?.includes(currentSeller.id);
    if (hasCompleted) return { label: 'Concluída', completed: true, canClaim: false };
    
    const sellerValue = mission.criterion === 'points'
        ? (currentSeller.points || 0) + (currentSeller.extraPoints || 0)
        : currentSeller[mission.criterion as keyof typeof currentSeller] as number;

    const targetMet = sellerValue >= mission.target;
    
    if (targetMet) return { label: 'Resgatar Recompensa', completed: false, canClaim: true };
    
    return { label: 'Ativa', completed: false, canClaim: false };
  };

  const formatReward = (mission: Mission) => {
    if (mission.rewardType === 'cash') {
      return mission.rewardValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return `${mission.rewardValue} pts`;
  }

  const missionCriteria = [
      { value: 'salesValue', label: 'Valor de Venda' },
      { value: 'ticketAverage', label: 'Ticket Médio' },
      { value: 'pa', label: 'PA' },
      { value: 'points', label: 'Pontos' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Target className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Minhas Missões</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Missões Disponíveis</CardTitle>
          <CardDescription>Complete os desafios para ganhar pontos e prémios!</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : missions.length > 0 ? (
             <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Missão</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission) => {
                    const status = getMissionStatus(mission);
                    const criterionLabel = missionCriteria.find(c => c.value === mission.criterion)?.label || mission.criterion;
                    return (
                        <TableRow key={mission.id} className={status.completed ? 'text-muted-foreground' : ''}>
                        <TableCell className="font-medium">{mission.name}</TableCell>
                        <TableCell>{criterionLabel}: {mission.target.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold text-primary">{formatReward(mission)}</TableCell>
                        <TableCell className="text-center">
                            {status.canClaim ? (
                                <Button size="sm" onClick={() => handleClaimReward(mission)} disabled={claiming === mission.id}>
                                    {claiming === mission.id ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Award className="mr-2 size-4" />}
                                    {status.label}
                                </Button>
                            ) : (
                                <Badge variant={status.completed ? 'secondary' : 'default'} className="flex items-center justify-center gap-2">
                                    {status.completed && <CheckCircle className="size-4 text-green-500" />}
                                    <span>{status.label}</span>
                                </Badge>
                            )}
                        </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <Target className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">Nenhuma missão disponível</p>
              <p className="text-sm">Volte em breve para novos desafios.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}