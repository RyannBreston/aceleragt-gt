'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star, Calendar, Trash2, CalendarIcon, PlusCircle, Loader2 } from 'lucide-react'; // Correção aqui
import { useAdminContext } from '@/app/admin/layout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const [newMission, setNewMission] = useState<Partial<Mission>>({
      name: '', description: '', rewardValue: 100, rewardType: 'points', criterion: 'salesValue', target: 1000, completedBy: []
  });

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const missionsCollectionPath = `artifacts/${appId}/public/data/missions`;

  useEffect(() => {
    const q = query(collection(db, missionsCollectionPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
  
  const handleInputChange = (field: keyof Omit<Mission, 'id' | 'startDate' | 'endDate' | 'completedBy'>, value: string | number) => {
      setNewMission(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMission.name || !newMission.rewardValue || !newMission.startDate || !newMission.endDate || !newMission.criterion || !newMission.target) {
        toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Por favor, preencha todos os campos da missão.' });
        return;
    }

    try {
        await addDoc(collection(db, missionsCollectionPath), {
            ...newMission,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Missão Adicionada!' });
        setNewMission({ name: '', description: '', rewardValue: 100, rewardType: 'points', criterion: 'salesValue', target: 1000, completedBy: [] });
    } catch (error) {
        console.error("Erro ao adicionar missão:", error);
        toast({ variant: 'destructive', title: 'Erro ao criar missão.' });
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta missão?')) {
        await deleteDoc(doc(db, missionsCollectionPath, id));
        toast({ title: 'Missão Excluída!' });
    }
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
                    <Input id="missionName" placeholder="Ex: Vender 5 Pares do Modelo X" value={newMission.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="missionDescription">Descrição da Missão</Label>
                    <Input id="missionDescription" placeholder="Descreva o objetivo da missão." value={newMission.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                </div>
            </div>
             <div className="grid md:grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="missionCriterion">Critério</Label>
                 <Select value={newMission.criterion} onValueChange={(v) => handleInputChange('criterion', v as string)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{missionCriteria.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
                <div className="space-y-2">
                    <Label htmlFor="missionTarget">Objetivo</Label>
                    <Input id="missionTarget" type="number" value={newMission.target || ''} onChange={(e) => handleInputChange('target', Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="missionRewardType">Tipo de Recompensa</Label>
                    <Select value={newMission.rewardType} onValueChange={(v) => handleInputChange('rewardType', v as 'points' | 'cash')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="points">Pontos</SelectItem><SelectItem value="cash">Dinheiro (R$)</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="missionRewardValue">Valor da Recompensa</Label>
                    <Input id="missionRewardValue" type="number" value={newMission.rewardValue || ''} onChange={(e) => handleInputChange('rewardValue', Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="missionStartDate">Data de Início</Label>
                    <Popover><PopoverTrigger asChild><Button id="missionStartDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !newMission.startDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{newMission.startDate ? format(newMission.startDate, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={newMission.startDate} onSelect={(date) => setNewMission(p => ({...p, startDate: date}))} initialFocus /></PopoverContent></Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="missionEndDate">Data de Fim</Label>
                    <Popover><PopoverTrigger asChild><Button id="missionEndDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !newMission.endDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{newMission.endDate ? format(newMission.endDate, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={newMission.endDate} onSelect={(date) => setNewMission(p => ({...p, endDate: date}))} initialFocus disabled={{ before: newMission.startDate }} /></PopoverContent></Popover>
                </div>
             </div>
            <Button type="submit"><PlusCircle className="mr-2" />Criar Nova Missão</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Missões Ativas</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Missão</TableHead><TableHead>Critério</TableHead><TableHead>Objetivo</TableHead><TableHead>Recompensa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                  : missions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">{mission.name}</TableCell>
                      <TableCell>{missionCriteria.find(c => c.value === mission.criterion)?.label}</TableCell>
                      <TableCell>{mission.target}</TableCell>
                      <TableCell className="font-semibold">{formatReward(mission)}</TableCell>
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