'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star, Calendar, Trash2, CalendarIcon } from 'lucide-react';
import { useAdminContext } from '@/app/admin/layout';
import { format } from 'date-fns';
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

export default function MissionsPage() {
  const { missions, setMissions } = useAdminContext();
  const [missionName, setMissionName] = useState('');
  const [missionDescription, setMissionDescription] = useState('');
  const [missionRewardValue, setMissionRewardValue] = useState('');
  const [missionRewardType, setMissionRewardType] = useState<'points' | 'cash'>('points');
  const [missionStartDate, setMissionStartDate] = useState<Date>();
  const [missionEndDate, setMissionEndDate] = useState<Date>();

  const handleAddMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionName.trim() || !missionRewardValue || !missionStartDate || !missionEndDate) return;

    const newMission: Mission = {
      id: new Date().getTime().toString(),
      name: missionName,
      description: missionDescription,
      rewardValue: parseInt(missionRewardValue, 10),
      rewardType: missionRewardType,
      startDate: missionStartDate,
      endDate: missionEndDate,
    };
    setMissions(prev => [...prev, newMission]);
    setMissionName('');
    setMissionDescription('');
    setMissionRewardValue('');
    setMissionRewardType('points');
    setMissionStartDate(undefined);
    setMissionEndDate(undefined);
  };

  const handleDeleteMission = (id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl">Criar Nova Missão</CardTitle>
          <CardDescription>Crie e gerencie as missões para os vendedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMission} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="missionName">Nome da Missão</Label>
                <Input id="missionName" placeholder="Ex: Vender 5 Pares do Modelo X" className="bg-input" value={missionName} onChange={(e) => setMissionName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missionRewardType">Tipo de Recompensa</Label>
                 <Select value={missionRewardType} onValueChange={(value) => setMissionRewardType(value as 'points' | 'cash')}>
                  <SelectTrigger id="missionRewardType">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Pontos</SelectItem>
                    <SelectItem value="cash">Dinheiro (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="missionDescription">Descrição da Missão</Label>
                 <Textarea id="missionDescription" placeholder="Descreva o objetivo da missão." className="bg-input" rows={2} value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} />
               </div>
                <div className="space-y-2">
                  <Label htmlFor="missionRewardValue">
                    {missionRewardType === 'points' ? 'Pontos de Recompensa' : 'Valor do Prêmio (R$)'}
                  </Label>
                  <Input id="missionRewardValue" placeholder="Ex: 200" type="number" className="bg-input" value={missionRewardValue} onChange={(e) => setMissionRewardValue(e.target.value)} required />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="missionStartDate">Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="missionStartDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal bg-input', !missionStartDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {missionStartDate ? format(missionStartDate, 'PPP') : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={missionStartDate} onSelect={setMissionStartDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="missionEndDate">Data de Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="missionEndDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal bg-input', !missionEndDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {missionEndDate ? format(missionEndDate, 'PPP') : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={missionEndDate} onSelect={setMissionEndDate} initialFocus disabled={{ before: missionStartDate }} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground font-semibold">
              Criar Nova Missão
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Missões Ativas</CardTitle>
          <CardDescription>
            Visualize todas as missões disponíveis para os vendedores.
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
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">{mission.name}</TableCell>
                      <TableCell>{format(mission.startDate, 'dd/MM/yy')} - {format(mission.endDate, 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-center font-semibold">{formatReward(mission)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMission(mission.id)} aria-label="Remover missão">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">Nenhuma missão encontrada</p>
              <p className="text-sm">
                Crie uma nova missão no formulário acima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
