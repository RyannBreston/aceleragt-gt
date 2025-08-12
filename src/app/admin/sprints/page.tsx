'use client';

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Save, Zap, MoreVertical, Pencil, Trash2, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller, DailySprint, SprintTier } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type SprintFormData = Omit<DailySprint, 'id' | 'createdAt'>;

const SprintFormModal = ({ sprint, onSave, sellers, children }: { sprint?: DailySprint | null; onSave: (data: SprintFormData) => Promise<void>; sellers: Seller[]; children: React.ReactNode; }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [sprintTiers, setSprintTiers] = useState<SprintTier[]>([{ goal: 0, points: 0, label: "Meta 1" }]);
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setTitle(sprint?.title || '');
            setSprintTiers(sprint?.sprintTiers || [{ goal: 200, points: 50, label: "Meta 1" }, { goal: 400, points: 100, label: "Meta 2" }, { goal: 600, points: 150, label: "Meta 3" }, { goal: 800, points: 250, label: "Meta 4" }]);
            setParticipantIds(sprint?.participantIds || []);
            setIsActive(sprint?.isActive || false);
        }
    }, [isOpen, sprint]);

    const handleTierChange = (index: number, field: 'goal' | 'points', value: string) => {
        const newTiers = [...sprintTiers];
        newTiers[index] = { ...newTiers[index], [field]: Number(value) || 0 };
        setSprintTiers(newTiers);
    };

    const handleSave = async () => {
        if (!title.trim() || participantIds.length === 0) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Título e pelo menos um participante são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        await onSave({ title, sprintTiers, participantIds, isActive });
        setIsSubmitting(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{sprint ? 'Editar' : 'Criar'} Corridinha</DialogTitle><DialogDescription>Defina os detalhes e metas da corridinha.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div><Label htmlFor="sprint-title">Título</Label><Input id="sprint-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="space-y-3">
                        <Label>Níveis de Metas</Label>
                        {sprintTiers.map((tier, index) => (
                            <div key={index} className="flex items-center gap-2"><Label className="w-16 text-sm">Meta {index + 1}</Label><Input type="number" value={tier.goal} onChange={e => handleTierChange(index, 'goal', e.target.value)} placeholder="Valor (R$)" /><Input type="number" value={tier.points} onChange={e => handleTierChange(index, 'points', e.target.value)} placeholder="Prêmio (Pts)" /></div>
                        ))}
                    </div>
                    <div>
                        <Label>Participantes ({participantIds.length})</Label>
                        <div className="mt-2 p-3 border rounded-md max-h-48 overflow-y-auto space-y-2">
                            <div className="flex items-center"><Checkbox id="selectAll" checked={participantIds.length === sellers.length} onCheckedChange={checked => setParticipantIds(checked ? sellers.map(s => s.id) : [])} /><Label htmlFor="selectAll" className="ml-2 font-medium">Selecionar Todos</Label></div>
                            <hr/>
                            {sellers.map(s => <div key={s.id} className="flex items-center"><Checkbox id={s.id} checked={participantIds.includes(s.id)} onCheckedChange={checked => setParticipantIds(p => checked ? [...p, s.id] : p.filter(id => id !== s.id))} /><Label htmlFor={s.id} className="ml-2">{s.name}</Label></div>)}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SprintCard = ({ sprint, onToggle, onEdit, onDelete }: { sprint: DailySprint; onToggle: (id: string, state: boolean) => void; onEdit: (data: DailySprint) => void; onDelete: (id: string) => void; }) => (
    <Card className={sprint.isActive ? "border-primary shadow-lg" : ""}>
        <CardHeader>
            <CardTitle className="flex justify-between items-start">
                <span>{sprint.title}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(sprint)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(sprint.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardTitle>
            <CardDescription><Users className="inline size-4 mr-1.5" />{sprint.participantIds.length} Participantes</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center p-6 bg-muted/40 rounded-b-lg">
            <div className="flex items-center gap-3">
                <Switch checked={sprint.isActive} onCheckedChange={(checked) => onToggle(sprint.id, checked)} id={`switch-${sprint.id}`} />
                <Label htmlFor={`switch-${sprint.id}`} className="font-semibold">{sprint.isActive ? 'Ativa' : 'Inativa'}</Label>
            </div>
            <div className="text-sm">
                <p><strong>Meta Máx:</strong> {Math.max(...sprint.sprintTiers.map(t => t.goal)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Prêmio Máx:</strong> {Math.max(...sprint.sprintTiers.map(t => t.points))} pts</p>
            </div>
        </CardContent>
    </Card>
);


export default function AdminSprintsPage() {
    const { sellers, sprints, setSprints, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = useCallback(async (data: SprintFormData, id?: string) => {
        setIsLoading(true);
        try {
            const callable = httpsCallable(functions, id ? 'updateDailySprint' : 'createDailySprint');
            const result = await callable({ ...data, id });
            const savedSprint = { ...data, id: (result.data as any).id || id, createdAt: new Date() }; // Simula o retorno
            
            setSprints(prev => id ? prev.map(s => s.id === id ? savedSprint : (data.isActive ? {...s, isActive: false} : s) ) : [...prev, savedSprint]);

            if(data.isActive) {
                setSprints(prev => prev.map(s => s.id === savedSprint.id ? {...s, isActive: true} : {...s, isActive: false}));
            }

            toast({ title: 'Sucesso!', description: `Corridinha ${id ? 'atualizada' : 'criada'}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: String(error) });
        } finally {
            setIsLoading(false);
        }
    }, [setSprints, toast]);

    const handleToggle = useCallback(async (id: string, isActive: boolean) => {
        const sprint = sprints.find(s => s.id === id);
        if(!sprint) return;
        
        await handleSave({ ...sprint, isActive }, id);
    }, [sprints, handleSave]);

    const handleDelete = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const callable = httpsCallable(functions, 'deleteDailySprint');
            await callable({ id });
            setSprints(prev => prev.filter(s => s.id !== id));
            toast({ title: 'Sucesso!', description: 'Corridinha excluída.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: String(error) });
        } finally {
            setIsLoading(false);
        }
    }, [setSprints, toast]);


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><Zap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Corridinhas Diárias</h1></div>
                <SprintFormModal onSave={(data) => handleSave(data)} sellers={sellers}>
                    <Button><PlusCircle className="mr-2 size-4" /> Criar Corridinha</Button>
                </SprintFormModal>
            </div>
            
            {isLoading && <EmptyState Icon={Loader2} title="A processar..." className="animate-spin" />}

            {!isLoading && !isAuthReady && <EmptyState Icon={Loader2} title="A carregar..." className="animate-spin" />}
            
            {!isLoading && isAuthReady && sprints.length === 0 && <EmptyState Icon={Zap} title="Nenhuma Corridinha Criada" description="Crie a sua primeira corridinha para começar a gamificar as suas vendas."/>}
            
            {!isLoading && isAuthReady && sprints.length > 0 &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sprints.map(sprint => (
                        <SprintFormModal key={sprint.id} sprint={sprint} onSave={(data) => handleSave(data, sprint.id)} sellers={sellers}>
                           <SprintCard sprint={sprint} onToggle={handleToggle} onEdit={() => {}} onDelete={handleDelete} />
                        </SprintFormModal>
                    ))}
                </div>
            }
        </div>
    );
}
