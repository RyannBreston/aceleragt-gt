'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Mission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Componente de formulário para criar/editar Missão
const MissionForm = ({ mission, onSave, onCancel }: { mission?: Mission | null, onSave: (data: any) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        title: mission?.title || '',
        description: mission?.description || '',
        points: mission?.points || 10,
        type: mission?.type || 'venda',
        goal: mission?.goal || 0,
        course_id: mission?.course_id || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid items-center gap-1.5 sm:col-span-2">
                    <Label htmlFor="title">Título da Missão</Label>
                    <Input id="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="grid items-center gap-1.5 sm:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={formData.description} onChange={handleChange} />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="points">Pontos</Label>
                    <Input id="points" type="number" value={formData.points} onChange={handleChange} required />
                </div>
                 <div className="grid items-center gap-1.5">
                    <Label htmlFor="goal">Objetivo (se aplicável)</Label>
                    <Input id="goal" type="number" value={formData.goal} onChange={handleChange} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Missão</Button>
            </DialogFooter>
        </form>
    );
};

export default function MissionsPage() {
    const { missions, isLoading, saveMission, deleteMission } = useAdminContext();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);

    const handleOpenDialog = (mission?: Mission) => {
        setEditingMission(mission || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingMission(null);
    };

    const handleSave = async (data: any) => {
        try {
            await saveMission(data, editingMission?.id);
            handleCloseDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro!', description: error.message });
        }
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerir Missões</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Missão
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMission ? 'Editar' : 'Criar'} Missão</DialogTitle>
                        </DialogHeader>
                        <MissionForm
                            mission={editingMission}
                            onSave={handleSave}
                            onCancel={handleCloseDialog}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {missions.map((mission) => (
                    <Card key={mission.id}>
                        <CardHeader>
                            <CardTitle>{mission.title}</CardTitle>
                            <CardDescription>{mission.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-bold text-lg">{mission.points} Pontos</p>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                             <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(mission)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação é irreversível e irá apagar a missão permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteMission(mission.id)}>Apagar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}