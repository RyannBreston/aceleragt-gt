/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Loader2, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Mission } from '@/lib/types';
import { useAdminContext } from '@/contexts/AdminContext';

// Validação do formulário com Zod
const missionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'O título é obrigatório'),
  description: z.string().optional(),
  goal: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive('A meta deve ser um número positivo')),
  prize: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive('O prêmio deve ser um número positivo')),
});

type MissionFormData = z.infer<typeof missionSchema>;

// Formulário de Missão
const MissionForm = ({ mission, onSave, onCancel, isSaving }: { mission?: Mission | null, onSave: (data: MissionFormData) => void, onCancel: () => void, isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<MissionFormData>({
        resolver: zodResolver(missionSchema),
        defaultValues: mission ? { ...mission, goal: String(mission.goal), prize: String(mission.prize)}: { title: '', description: '', goal: 0, prize: 0 },
    });

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{mission ? 'Editar Missão' : 'Criar Nova Missão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea id="description" {...register('description')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="goal">Meta de Vendas (R$)</Label>
                    <Input id="goal" type="number" step="0.01" {...register('goal')} />
                    {errors.goal && <p className="text-sm text-red-500">{errors.goal.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="prize">Prêmio (R$)</Label>
                    <Input id="prize" type="number" step="0.01" {...register('prize')} />
                    {errors.prize && <p className="text-sm text-red-500">{errors.prize.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        Salvar Missão
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default function MissionsPage() {
    const { missions, isLoading, saveMission, deleteMission } = useAdminContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async (data: MissionFormData) => {
        setIsSaving(true);
        try {
            await saveMission(data, data.id);
            toast({ title: "Sucesso!", description: "Missão salva com sucesso." });
            setIsFormOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
         if (!window.confirm("Tem certeza que deseja excluir esta missão?")) return;
        try {
            await deleteMission(id);
            toast({ title: "Sucesso!", description: "Missão excluída." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Erro ao Excluir", description: error.message });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gerir Missões</h1>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <Button onClick={() => { setSelectedMission(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Missão
                    </Button>
                   {isFormOpen && <MissionForm mission={selectedMission} onSave={handleSave} onCancel={() => setIsFormOpen(false)} isSaving={isSaving}/>}
                </Dialog>
            </div>

            <Card>
                <CardContent className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : missions && missions.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Meta</TableHead>
                                <TableHead>Prêmio</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {missions.map((mission) => (
                                    <TableRow key={mission.id}>
                                        <TableCell className="font-medium">{mission.title}</TableCell>
                                        <TableCell>R$ {mission.goal}</TableCell>
                                        <TableCell>R$ {mission.prize}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setSelectedMission(mission); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(mission.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center p-6 text-gray-500">Nenhuma missão encontrada.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
