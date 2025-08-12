'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from '@/components/CurrencyInput';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Save, Zap, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { Timestamp } from 'firebase/firestore';
import type { Seller, DailySprint, SprintTier } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type SprintFormData = Omit<DailySprint, 'id' | 'createdAt'>;
type CallableSprintResult = { id?: string; };


const SprintFormModal = ({ sprint, onSave, sellers, children }: { sprint?: DailySprint | null; onSave: (data: SprintFormData) => Promise<void>; sellers: Seller[]; children: React.ReactNode; }) => {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [sprintTiers, setSprintTiers] = useState<SprintTier[]>([{ goal: 0, points: 0, label: "Meta 1" }]);
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (sprint) {
            setTitle(sprint.title);
            setSprintTiers(sprint.sprintTiers);
            setParticipantIds(sprint.participantIds);
            setIsActive(sprint.isActive);
        } else {
            setTitle('');
            setSprintTiers([{ goal: 200, points: 50, label: "Meta 1" }, { goal: 400, points: 100, label: "Meta 2" }, { goal: 600, points: 150, label: "Meta 3" }, { goal: 800, points: 250, label: "Meta 4" }]);
            setParticipantIds([]);
            setIsActive(false);
        }
    }, [sprint]);

    const handleTierChange = (index: number, field: 'goal' | 'points', value?: number) => {
        const newTiers = [...sprintTiers];
        newTiers[index] = { ...newTiers[index], [field]: value || 0 };
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
    };
    
    const formContent = (
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div><Label htmlFor="sprint-title">Título</Label><Input id="sprint-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-3">
                <Label>Níveis de Metas</Label>
                {sprintTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] items-center gap-2">
                        <Label className="text-sm sm:text-right">Meta {index + 1}</Label>
                        <CurrencyInput value={tier.goal} onValueChange={value => handleTierChange(index, 'goal', value)} placeholder="Valor (R$)" />
                        <Input type="number" value={tier.points} onChange={e => handleTierChange(index, 'points', Number(e.target.value))} placeholder="Prêmio (Pts)" />
                    </div>
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
    );
    
    const formFooter = (
        <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar</Button>
        </div>
    );

    return (
        <ResponsiveDialog
            title={sprint ? 'Editar Corridinha' : 'Criar Corridinha'}
            description="Defina os detalhes e metas da corridinha."
            content={formContent}
            footer={formFooter}
        >
            {children}
        </ResponsiveDialog>
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
    const { sellers, sprints: contextSprints, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    const [sprints, setSprints] = useState<DailySprint[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSprints(contextSprints);
    }, [contextSprints]);

    const handleSave = useCallback(async (data: SprintFormData, id?: string) => {
        setIsLoading(true);
        try {
            const action = id ? 'updateDailySprint' : 'createDailySprint';
            const callable = httpsCallable<object, CallableSprintResult>(functions, 'api');
            const result = await callable({ action, ...data, id });
            const resultData = result.data;

            const newOrUpdatedId = resultData.id || id;
            if (!newOrUpdatedId) {
                throw new Error("Não foi possível obter um ID para a corridinha.");
            }

            const savedSprint: DailySprint = { ...data, id: newOrUpdatedId, createdAt: Timestamp.now() };
            
            setSprints(prev => {
                const newSprints = id ? prev.map(s => (s.id === id ? savedSprint : s)) : [...prev, savedSprint];
                if (data.isActive) {
                    return newSprints.map(s => ({ ...s, isActive: s.id === savedSprint.id }));
                }
                return newSprints;
            });

            toast({ title: 'Sucesso!', description: `Corridinha ${id ? 'atualizada' : 'criada'}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: String(error) });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleToggle = useCallback(async (id: string, isActive: boolean) => {
        const sprint = sprints.find(s => s.id === id);
        if(!sprint) return;
        
        await handleSave({ ...sprint, isActive }, id);
    }, [sprints, handleSave]);

    const handleDelete = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const callable = httpsCallable(functions, 'api');
            await callable({ action: 'deleteDailySprint', id });
            setSprints(prev => prev.filter(s => s.id !== id));
            toast({ title: 'Sucesso!', description: 'Corridinha excluída.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: String(error) });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><Zap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Corridinhas Diárias</h1></div>
                <SprintFormModal onSave={(data) => handleSave(data)} sellers={sellers}>
                    <Button><PlusCircle className="mr-2 size-4" /> Criar Corridinha</Button>
                </SprintFormModal>
            </div>
            
            {isLoading && <EmptyState Icon={Loader2} title="A processar..." description="Aguarde um momento." className="animate-spin" />}

            {!isLoading && !isAuthReady && <EmptyState Icon={Loader2} title="A carregar..." description="A obter os dados mais recentes." className="animate-spin" />}
            
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
