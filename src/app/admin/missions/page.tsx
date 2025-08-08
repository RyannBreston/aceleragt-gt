'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const missionCriteria = [
    { value: 'salesValue', label: 'Valor de Venda (R$)' },
    { value: 'ticketAverage', label: 'Ticket Médio (R$)' },
    { value: 'pa', label: 'Produtos por Atendimento (PA)' },
    { value: 'points', label: 'Pontos Acumulados' },
];

export default function MissionsPage() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMission, setNewMission] = useState<Partial<Omit<Mission, 'id' | 'createdAt'>>>({
      title: '', description: '', points: 100, metric: 'salesValue', goal: 1000, isActive: true
  });

  const missionsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/missions`;

  useEffect(() => {
    const q = query(collection(db, missionsCollectionPath), orderBy('createdAt', 'desc'));
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
  
  const handleInputChange = (field: keyof Omit<Mission, 'id' | 'createdAt' | 'deadline'>, value: string | number | boolean) => {
      setNewMission(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMission.title || !newMission.points || !newMission.deadline || !newMission.metric || !newMission.goal) {
        toast({ variant: 'destructive', title: 'Campos Obrigatórios' });
        return;
    }
    try {
        await addDoc(collection(db, missionsCollectionPath), { ...newMission, createdAt: serverTimestamp() });
        toast({ title: 'Missão Adicionada!' });
        setNewMission({ title: '', description: '', points: 100, metric: 'salesValue', goal: 1000, isActive: true });
    } catch {
        toast({ variant: 'destructive', title: 'Erro ao criar missão.' });
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta missão?')) {
        await deleteDoc(doc(db, missionsCollectionPath, id));
        toast({ title: 'Missão Excluída!' });
    }
  };
  
  const handleToggleMissionStatus = async (missionId: string, currentStatus: boolean) => {
      const missionRef = doc(db, missionsCollectionPath, missionId);
      try {
          await updateDoc(missionRef, { isActive: !currentStatus });
          toast({ title: `Missão ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!` });
      } catch {
          toast({ variant: 'destructive', title: 'Erro ao alterar o status da missão.' });
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Target className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Gerenciamento de Missões</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Criar Nova Missão</CardTitle>
          <CardDescription>Defina desafios para os vendedores ganharem recompensas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMission} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="missionName">Nome da Missão</Label>
                    <Input id="missionName" placeholder="Ex: Vender 5 Pares do Modelo X" value={newMission.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="missionDescription">Descrição da Missão</Label>
                    <Input id="missionDescription" placeholder="Descreva o objetivo da missão." value={newMission.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                </div>
            </div>
             <div className="grid md:grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="missionCriterion">Critério</Label>
                 <Select value={newMission.metric} onValueChange={(v) => handleInputChange('metric', v as string)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{missionCriteria.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
                <div className="space-y-2">
                    <Label htmlFor="missionTarget">Objetivo</Label>
                    <Input id="missionTarget" type="number" value={newMission.goal || ''} onChange={(e) => handleInputChange('goal', Number(e.target.value))} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="missionRewardValue">Recompensa (Pontos)</Label>
                    <Input id="missionRewardValue" type="number" value={newMission.points || ''} onChange={(e) => handleInputChange('points', Number(e.target.value))} required />
                </div>
            </div>
             <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="missionEndDate">Data de Fim</Label>
                    <Popover><PopoverTrigger asChild><Button id="missionEndDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !newMission.deadline && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{newMission.deadline ? format(newMission.deadline, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={newMission.deadline} onSelect={(date) => setNewMission(p => ({...p, deadline: date || undefined}))} initialFocus /></PopoverContent></Popover>
                </div>
             </div>
            <Button type="submit"><PlusCircle className="mr-2" />Criar Nova Missão</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Missões Criadas</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Missão</TableHead><TableHead>Objetivo</TableHead><TableHead>Recompensa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                  : missions.map((mission) => (
                    <TableRow key={mission.id} className={!mission.isActive ? 'text-muted-foreground bg-muted/30' : ''}>
                      <TableCell>
                        <Switch
                            checked={mission.isActive}
                            onCheckedChange={() => handleToggleMissionStatus(mission.id, mission.isActive)}
                            aria-label="Ativar/desativar missão"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{mission.title}</TableCell>
                      <TableCell>{missionCriteria.find(c => c.value === mission.metric)?.label}: {mission.goal}</TableCell>
                      <TableCell className="font-semibold">{mission.points} pts</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMission(mission.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}