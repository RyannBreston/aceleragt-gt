'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle, Award, Loader2 } from 'lucide-react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, query, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const missionCriteria = [
    { value: 'salesValue', label: 'Vendas', format: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { value: 'ticketAverage', label: 'Ticket Médio', format: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { value: 'pa', label: 'PA', format: (val: number) => val.toFixed(2) },
    { value: 'points', label: 'Pontos', format: (val: number) => val.toLocaleString('pt-BR') },
];

export default function MissionsPage() {
  const { currentSeller, setSellers } = useSellerContext();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const missionsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/missions`;

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
        collection(db, missionsCollectionPath), 
        where('isActive', '==', true),
        where('deadline', '>=', now)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const missionsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            deadline: d.data().deadline?.toDate(),
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

          await updateDoc(sellerRef, { points: (currentSeller.points || 0) + mission.points });
          await updateDoc(missionRef, { completedBy: arrayUnion(currentSeller.id) });

          setSellers(prev => prev.map(s => {
              if (s.id !== currentSeller.id) return s;
              return { ...s, points: (s.points || 0) + mission.points };
          }));
          
          toast({ title: 'Recompensa Resgatada!', description: `Você ganhou: ${mission.points} pts`});
      } catch {
          toast({ variant: 'destructive', title: 'Erro ao resgatar.' });
      } finally {
          setClaiming(null);
      }
  };

  const getMissionStatus = (mission: Mission) => {
    if (!currentSeller) return { label: 'Ativa', completed: false, canClaim: false, progress: 0, currentValue: 0 };
    
    const hasCompleted = mission.completedBy?.includes(currentSeller.id);
    const sellerValue = mission.metric === 'points'
        ? (currentSeller.points || 0) + (currentSeller.extraPoints || 0)
        : (currentSeller[mission.metric as keyof typeof currentSeller] as number || 0);

    const progress = Math.min(100, (sellerValue / mission.goal) * 100);
    
    if (hasCompleted) return { label: 'Concluída', completed: true, canClaim: false, progress: 100, currentValue: sellerValue };
    
    const targetMet = sellerValue >= mission.goal;
    if (targetMet) return { label: 'Resgatar Recompensa', completed: false, canClaim: true, progress: 100, currentValue: sellerValue };
    
    return { label: 'Ativa', completed: false, canClaim: false, progress, currentValue: sellerValue };
  };

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
                    <TableHead className="w-[30%]">Missão</TableHead>
                    <TableHead className="w-[40%]">Progresso</TableHead>
                    <TableHead className="text-right">Recompensa</TableHead>
                    <TableHead className="text-center w-[180px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission) => {
                    const status = getMissionStatus(mission);
                    const criterionInfo = missionCriteria.find(c => c.value === mission.metric);
                    return (
                        <TableRow key={mission.id} className={status.completed ? 'bg-muted/30 text-muted-foreground' : ''}>
                        <TableCell className="font-medium">
                            <p>{mission.title}</p>
                            <p className="text-xs text-muted-foreground">{mission.description}</p>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-2">
                                <Progress value={status.progress} className="h-3" />
                                <div className="text-xs font-semibold text-muted-foreground">
                                    <span>{criterionInfo?.format(status.currentValue)} / </span>
                                    <span>{criterionInfo?.format(mission.goal)}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">{mission.points} pts</TableCell>
                        <TableCell className="text-center">
                            {status.canClaim ? (
                                <Button size="sm" onClick={() => handleClaimReward(mission)} disabled={claiming === mission.id} className="bg-green-600 hover:bg-green-700">
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