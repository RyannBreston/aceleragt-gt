'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { DailySprint, Seller } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Componente do formulário para não poluir a página principal
const SprintForm = ({ sprint, onSave, onCancel }: { sprint?: DailySprint | null, onSave: (data: any) => void, onCancel: () => void }) => {
    const { sellers } = useAdminContext();
    const [title, setTitle] = useState(sprint?.title || '');
    const [participantIds, setParticipantIds] = useState<string[]>(sprint?.participant_ids || []);
    // Tiers são complexos, vamos usar JSON por enquanto para simplicidade
    const [sprintTiers, setSprintTiers] = useState(sprint?.sprint_tiers ? JSON.stringify(sprint.sprint_tiers, null, 2) : '[\n  {\n    "goal": 1000,\n    "prize": 50\n  }\n]');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedTiers = JSON.parse(sprintTiers);
            onSave({
                title,
                participantIds,
                sprintTiers: parsedTiers,
            });
        } catch (error) {
            alert('Formato de JSON inválido para os prémios.');
        }
    };

    const toggleParticipant = (sellerId: string) => {
        setParticipantIds(prev =>
            prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Título</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Participantes</Label>
                    <div className="col-span-3 h-32 overflow-y-auto rounded-md border p-2">
                        {sellers.map((seller: Seller) => (
                            <div key={seller.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={`seller-${seller.id}`}
                                    checked={participantIds.includes(seller.id)}
                                    onChange={() => toggleParticipant(seller.id)}
                                />
                                <label htmlFor={`seller-${seller.id}`}>{seller.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tiers" className="text-right">Prémios (JSON)</Label>
                    <Textarea id="tiers" value={sprintTiers} onChange={(e) => setSprintTiers(e.target.value)} className="col-span-3" rows={8} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </DialogFooter>
        </form>
    );
};


export default function SprintsPage() {
    const { sprints, isLoading, deleteSprint, toggleSprint, saveSprint } = useAdminContext();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<DailySprint | null>(null);

    const handleOpenDialog = (sprint?: DailySprint) => {
        setEditingSprint(sprint || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingSprint(null);
    };

    const handleSave = async (data: any) => {
        try {
            await saveSprint(data, editingSprint?.id);
            handleCloseDialog();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível salvar a corridinha.',
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSprint(id);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível excluir a corridinha.',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerir Corridinhas</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Nova Corridinha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingSprint ? 'Editar' : 'Criar'} Corridinha</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes da corridinha diária.
                            </DialogDescription>
                        </DialogHeader>
                        <SprintForm
                            sprint={editingSprint}
                            onSave={handleSave}
                            onCancel={handleCloseDialog}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {sprints.length === 0 ? (
                <p>Nenhuma corridinha encontrada.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sprints.map((sprint: DailySprint) => (
                        <Card key={sprint.id}>
                            <CardHeader>
                                <CardTitle>{sprint.title}</CardTitle>
                                <CardDescription>
                                    Participantes: {sprint.participant_ids?.length || 0}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={`flex items-center space-x-2 ${sprint.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                                    {sprint.is_active ? <ToggleRight /> : <ToggleLeft />}
                                    <span>{sprint.is_active ? 'Ativa' : 'Inativa'}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(sprint)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => toggleSprint(sprint, !sprint.is_active)}>
                                    {sprint.is_active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. Isto irá apagar permanentemente a corridinha.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(sprint.id)}>
                                                Continuar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}