/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Save, Zap, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import type { Seller, DailySprint, SprintTier } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/EmptyState'; // Importa o novo componente

type NewSprintData = Omit<DailySprint, 'id' | 'createdAt' | 'isActive'>;

// --- Sub-componente: Modal para Criar a Corridinha ---
const SprintFormModal = ({ isOpen, setIsOpen, onSave, sellers }: { isOpen: boolean; setIsOpen: (open: boolean) => void; onSave: (sprintData: NewSprintData) => Promise<void>; sellers: Seller[] }) => {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [sprintTiers, setSprintTiers] = useState<SprintTier[]>([
        { goal: 200, points: 50, label: "Meta 1" }, 
        { goal: 400, points: 100, label: "Meta 2" },
        { goal: 600, points: 150, label: "Meta 3" }, 
        { goal: 800, points: 250, label: "Meta 4" },
    ]);
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTierChange = (index: number, field: 'goal' | 'points', value: string) => {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return;
        const newTiers = [...sprintTiers];
        const tierToUpdate = { ...newTiers[index], [field]: numericValue };
        newTiers[index] = tierToUpdate;
        setSprintTiers(newTiers);
    };
    
    React.useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setParticipantIds([]);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O título da corridinha é obrigatório.' });
            return;
        }
        if (participantIds.length === 0) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Selecione pelo menos um participante.' });
            return;
        }

        setIsSubmitting(true);
        const sprintData = { 
            title, 
            participantIds, 
            sprintTiers: sprintTiers.map((tier, index) => ({ ...tier, label: `Meta ${index + 1}` }))
        };
        
        await onSave(sprintData);
        
        setIsSubmitting(false);
        setIsOpen(false);
    };
    
    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        setParticipantIds(checked ? sellers.map(s => s.id) : []);
    };

    const checkedState: boolean | 'indeterminate' = 
        participantIds.length === sellers.length && sellers.length > 0 ? true : 
        participantIds.length > 0 ? 'indeterminate' : false;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Criar Nova Corridinha</DialogTitle>
                    <DialogDescription>Defina os níveis de metas e os pontos de prêmio para a sua equipe.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-2"><Label htmlFor="sprint-title">Título da Corridinha</Label><Input id="sprint-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Sprint de Vendas Relâmpago" /></div>
                    <div className="space-y-4 rounded-md border p-4">
                        <Label className="font-semibold">Níveis de Metas e Prêmios</Label>
                        {sprintTiers.map((tier, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <Label className="w-20 text-sm text-muted-foreground">{tier.label}</Label>
                                <Input type="number" placeholder="Meta (R$)" value={tier.goal} onChange={(e) => handleTierChange(index, 'goal', e.target.value)} />
                                <Input type="number" placeholder="Prêmio (Pts)" value={tier.points} onChange={(e) => handleTierChange(index, 'points', e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <Label>Participantes</Label>
                        <div className="flex items-center space-x-2 mt-2 border-b pb-2 mb-2">
                            <Checkbox id="selectAll" onCheckedChange={handleSelectAll} checked={checkedState} />
                            <Label htmlFor="selectAll" className="font-semibold">Selecionar Todos</Label>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {sellers.map(seller => (
                                <div key={seller.id} className="flex items-center space-x-2">
                                    <Checkbox id={seller.id} checked={participantIds.includes(seller.id)} onCheckedChange={(checked) => setParticipantIds(prev => checked ? [...prev, seller.id] : prev.filter(id => id !== seller.id))} />
                                    <Label htmlFor={seller.id}>{seller.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Criar Corridinha</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// Página Principal
export default function AdminSprintsPage() {
    const { sellers, sprints, toggleSprint, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);

    const handleSaveSprint = async (sprintData: NewSprintData) => {
        try {
            const createSprintCallable = httpsCallable(functions, 'createDailySprint');
            await createSprintCallable(sprintData);
            toast({ title: 'Sucesso!', description: 'A corridinha diária foi criada. Ative-a para começar.' });
        } catch (error: unknown) {
            console.error("Erro ao chamar a Cloud Function 'createDailySprint':", error);
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao criar corridinha', description: errorMessage });
        }
    };
    
    const handleToggleSprint = async (sprint: DailySprint) => {
        setIsToggling(sprint.id);
        try {
            await toggleSprint(sprint.id, sprint.isActive);
            toast({ title: "Status alterado!", description: `A corridinha "${sprint.title}" foi ${sprint.isActive ? 'desativada' : 'ativada'}.`});
        } catch (error) {
             toast({ variant: "destructive", title: "Erro ao alterar status", description: "Não foi possível alterar o status da corridinha."});
        } finally {
            setIsToggling(null);
        }
    }

    const renderContent = () => {
        if (!isAuthReady) {
            return <EmptyState Icon={Loader2} title="A carregar..." description="Aguarde um momento." className="animate-spin"/>
        }
        if (sprints.length === 0) {
            return <EmptyState Icon={Zap} title="Nenhuma Corridinha Criada" description="Crie a sua primeira corridinha para começar a gamificar as suas vendas."/>
        }
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Meta Máxima</TableHead><TableHead>Participantes</TableHead><TableHead>Data</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sprints.map(sprint => (
                            <TableRow key={sprint.id} className={sprint.isActive ? 'bg-primary/5' : ''}>
                                <TableCell className="font-semibold">{sprint.title}</TableCell>
                                <TableCell>
                                    {sprint.sprintTiers && sprint.sprintTiers.length > 0 
                                        ? `Até ${Math.max(...sprint.sprintTiers.map(t => t.goal)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`
                                        : 'N/A'
                                    }
                                </TableCell>
                                <TableCell>{sprint.participantIds.length} / {sellers.length}</TableCell>
                                <TableCell>{sprint.createdAt ? format(sprint.createdAt.seconds * 1000, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</TableCell>
                                <TableCell className="text-center">
                                    <Button 
                                        size="sm"
                                        variant={sprint.isActive ? 'destructive' : 'outline'} 
                                        onClick={() => handleToggleSprint(sprint)}
                                        disabled={isToggling === sprint.id}
                                    >
                                        {isToggling === sprint.id 
                                            ? <Loader2 className="mr-2 size-4 animate-spin" />
                                            : sprint.isActive ? <PowerOff className="mr-2 size-4" /> : <Power className="mr-2 size-4" />
                                        }
                                        {sprint.isActive ? 'Desativar' : 'Ativar'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><Zap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Corridinhas Diárias</h1></div>
                <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="mr-2 size-4" /> Criar Nova Corridinha</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Corridinhas</CardTitle>
                    <CardDescription>Lista de todas as corridinhas criadas. Apenas uma pode estar ativa por vez.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

            <SprintFormModal isOpen={isModalOpen} setIsOpen={setIsOpen} onSave={handleSaveSprint} sellers={sellers} />
        </div>
    );
}
