'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from '@/components/CurrencyInput';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Save, Zap, MoreVertical, Pencil, Trash2, Users, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import type { Seller, DailySprint, SprintTier } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// --- Componente do Formulário (dentro da Modal) ---
const SprintForm = ({ initialData, sellers, onSave, onCancel }: { initialData: Partial<DailySprint>; sellers: Seller[]; onSave: (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => Promise<void>; onCancel: () => void; }) => {
    const { toast } = useToast();
    const [title, setTitle] = useState(initialData.title || '');
    const [sprintTiers, setSprintTiers] = useState<SprintTier[]>(initialData.sprintTiers || [{ goal: 200, prize: 10, label: ""}, { goal: 400, prize: 20, label: "" }, { goal: 600, prize: 30, label: "" }]);
    const [participantIds, setParticipantIds] = useState<string[]>(initialData.participantIds || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredSellers = useMemo(() => {
        return sellers.filter(seller => seller.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sellers, searchTerm]);

    const handleTierChange = (index: number, field: 'goal' | 'prize', value?: number) => {
        const newTiers = [...sprintTiers];
        newTiers[index] = { ...newTiers[index], [field]: value || 0, label: newTiers[index].label || "" };
        setSprintTiers(newTiers);
    };

    const handleAddTier = () => setSprintTiers(prev => [...prev, { goal: 0, prize: 0, label: "" }]);
    const handleRemoveTier = (index: number) => setSprintTiers(prev => prev.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (!title.trim() || participantIds.length === 0) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Título e pelo menos um participante são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        const sortedTiers = [...sprintTiers].sort((a, b) => a.goal - b.goal);
        await onSave({ title, sprintTiers: sortedTiers, participantIds, isActive: initialData.isActive || false }, initialData.id);
        setIsSubmitting(false);
    };

    return (
        <>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData.id ? 'Editar Corridinha' : 'Criar Corridinha'}</DialogTitle>
                    <DialogDescription>Defina as metas de vendas e o prémio em R$ correspondente.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 flex-grow overflow-y-auto pr-4">
                    <div><Label htmlFor="sprint-title">Título</Label><Input id="sprint-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="space-y-3">
                        <Label>Níveis de Metas</Label>
                        {sprintTiers.map((tier, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                                <CurrencyInput value={tier.goal} onValueChange={value => handleTierChange(index, 'goal', value)} placeholder="Valor da Meta (R$)" />
                                <CurrencyInput value={tier.prize} onValueChange={value => handleTierChange(index, 'prize', value)} placeholder="Prémio (R$)" />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveTier(index)} disabled={sprintTiers.length <= 1}><X className="size-4 text-muted-foreground" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddTier}><PlusCircle className="mr-2" /> Adicionar Nível</Button>
                    </div>
                    <div>
                        <Label>Participantes ({participantIds.length})</Label>
                        <div className="relative my-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar vendedor..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="mt-2 p-3 border rounded-md max-h-40 overflow-y-auto space-y-2">
                            <div className="flex items-center"><Checkbox id="selectAll" checked={participantIds.length === sellers.length} onCheckedChange={checked => setParticipantIds(checked ? sellers.map(s => s.id) : [])} /><Label htmlFor="selectAll" className="ml-2 font-medium">Selecionar Todos</Label></div>
                            <hr />
                            {filteredSellers.map(s => <div key={s.id} className="flex items-center"><Checkbox id={s.id} checked={participantIds.includes(s.id)} onCheckedChange={checked => setParticipantIds(p => checked ? [...p, s.id] : p.filter(id => id !== s.id))} /><Label htmlFor={s.id} className="ml-2">{s.name}</Label></div>)}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </>
    );
};


// --- Componente do Card de Visualização ---
const SprintCard = ({ sprint, onToggle, onEdit, onDelete }: { sprint: DailySprint; onToggle: (id: string, state: boolean) => void; onEdit: (sprint: DailySprint) => void; onDelete: (id: string) => void; }) => (
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
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(sprint.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
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
            <div className="text-sm text-right">
                <p><strong>Meta Máx:</strong> {Math.max(...sprint.sprintTiers.map(t => t.goal)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Prêmio Máx:</strong> {Math.max(...sprint.sprintTiers.map(t => t.prize)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
        </CardContent>
    </Card>
);

// --- Componente Principal da Página ---
export default function AdminSprintsPage() {
    const { sellers, sprints, saveSprint, deleteSprint, toggleSprint, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    const [sprintToEdit, setSprintToEdit] = useState<Partial<DailySprint> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAction = async (action: Promise<void>, messages: { success: string; error: string }) => {
        setIsSaving(true);
        try {
            await action;
            toast({ title: 'Sucesso!', description: messages.success });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : messages.error;
            toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => {
        await handleAction(saveSprint(data, id), {
            success: `Corridinha ${id ? 'atualizada' : 'criada'}.`,
            error: 'Ocorreu um erro ao salvar a corridinha.'
        });
        setSprintToEdit(null);
    };

    const handleToggle = (id: string, isActive: boolean) => handleAction(toggleSprint(id, isActive), {
        success: `Corridinha ${isActive ? 'ativada' : 'desativada'}.`,
        error: 'Ocorreu um erro ao alterar o estado da corridinha.'
    });

    const handleDelete = (id: string) => handleAction(deleteSprint(id), {
        success: 'Corridinha excluída.',
        error: 'Ocorreu um erro ao excluir a corridinha.'
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><Zap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Corridinhas Diárias</h1></div>
                <Button onClick={() => setSprintToEdit({})} disabled={isSaving}><PlusCircle className="mr-2 size-4" /> Criar Corridinha</Button>
            </div>
            
            {!isAuthReady ? (
                 <div className="text-center p-6"><Loader2 className="mx-auto animate-spin text-primary" /></div>
            ) : sprints.length === 0 ? (
                <EmptyState Icon={Zap} title="Nenhuma Corridinha Criada" description="Crie a sua primeira corridinha para começar a gamificar as suas vendas."/>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sprints.map(sprint => (
                        <SprintCard key={sprint.id} sprint={sprint} onToggle={handleToggle} onEdit={setSprintToEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <Dialog open={!!sprintToEdit} onOpenChange={(isOpen) => !isOpen && setSprintToEdit(null)}>
                {sprintToEdit && <SprintForm initialData={sprintToEdit} sellers={sellers} onSave={handleSave} onCancel={() => setSprintToEdit(null)} />}
            </Dialog>
        </div>
    );
}
