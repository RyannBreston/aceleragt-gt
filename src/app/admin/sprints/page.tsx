'use client';

import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Save, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from '@/contexts/AdminContext';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Seller } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos Corrigidos ---
interface SprintTier {
    goal: number;
    points: number; 
    label: string;
}
interface DailySprint {
    id: string;
    title: string;
    sprintTiers: SprintTier[];
    createdAt: { seconds: number, nanoseconds: number };
    participantIds: string[];
    isActive: boolean;
}
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

    const handleTierChange = (index: number, field: 'goal' | 'points', value: number) => {
        const newTiers = [...sprintTiers];
        const tierToUpdate = { ...newTiers[index], [field]: value };
        newTiers[index] = tierToUpdate;
        setSprintTiers(newTiers);
    };
    
    useEffect(() => {
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
                    <div className="space-y-2"><Label htmlFor="sprint-title">Título da Corridinha</Label><Input id="sprint-title" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Ex: Sprint de Vendas Relâmpago" /></div>
                    <div className="space-y-4 rounded-md border p-4">
                        <Label className="font-semibold">Níveis de Metas e Prêmios</Label>
                        {sprintTiers.map((tier, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <Label className="w-20 text-sm text-muted-foreground">{tier.label}</Label>
                                <Input type="number" placeholder="Meta (R$)" value={tier.goal} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTierChange(index, 'goal', Number(e.target.value))} />
                                <Input type="number" placeholder="Prêmio (Pts)" value={tier.points} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTierChange(index, 'points', Number(e.target.value))} />
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
    const { sellers } = useAdminContext();
    const { toast } = useToast();
    const [sprints, setSprints] = useState<DailySprint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const sprintsCollectionPath = useMemo(() => `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/dailySprints`, []);

    useEffect(() => {
        const q = query(collection(db, sprintsCollectionPath), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sprintsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailySprint));
            setSprints(sprintsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao carregar corridinhas:", error);
            const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar as corridinhas.";
            toast({ variant: "destructive", title: "Erro ao carregar dados", description: errorMessage });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [sprintsCollectionPath, toast]);

    const handleSaveSprint = async (sprintData: NewSprintData) => {
        try {
            const createSprintCallable = httpsCallable(functions, 'createDailySprint');
            await createSprintCallable(sprintData);
            toast({ title: 'Sucesso!', description: 'A corridinha diária foi criada e já está ativa.' });
        } catch (error: unknown) {
            console.error("Erro ao chamar a Cloud Function 'createDailySprint':", error);
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            toast({ variant: 'destructive', title: 'Erro ao criar corridinha', description: errorMessage });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><Zap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Corridinhas Diárias</h1></div>
                <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="mr-2 size-4" /> Criar Nova Corridinha</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Corridinhas</CardTitle>
                    <CardDescription>Lista de todas as corridinhas criadas, da mais recente para a mais antiga.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Meta Máxima</TableHead><TableHead>Participantes</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : sprints.length > 0 ? (
                                    sprints.map(sprint => (
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
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sprint.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {sprint.isActive ? "Ativa" : "Finalizada"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma corridinha criada ainda.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <SprintFormModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} onSave={handleSaveSprint} sellers={sellers} />
        </div>
    );
}