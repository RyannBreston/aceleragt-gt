'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, ChevronLeft, ChevronRight, Save, Loader2, Users, Settings, PlusCircle, Trash2 } from "lucide-react";
import { useAdminContext } from '@/app/admin/layout';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Seller } from '@/lib/types';
import { doc, updateDoc, collection, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// --- Tipos e Constantes ---
interface ShiftDefinition {
    id: string;
    name: string;
    time: string;
    color: string;
}

const weekDays = [
    { key: 'seg', label: 'Seg' }, { key: 'ter', label: 'Ter' }, { key: 'qua', label: 'Qua' },
    { key: 'qui', label: 'Qui' }, { key: 'sex', label: 'Sex' }, { key: 'sab', label: 'Sáb' }, { key: 'dom', label: 'Dom' },
];

const shiftColors: { [key: string]: string } = {
    blue: 'bg-blue-500/10 text-blue-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    pink: 'bg-pink-500/10 text-pink-400',
    gray: 'bg-gray-500/10 text-gray-400',
};

const getShiftClass = (shiftName?: string, definitions?: ShiftDefinition[]) => {
    const shift = definitions?.find(d => d.name === shiftName);
    if (shift?.color && shiftColors[shift.color]) {
        return shiftColors[shift.color];
    }
    return 'bg-muted/50 text-muted-foreground';
};

export default function AdminWorkSchedulePage() {
    const { sellers, setSellers, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    
    const [localSchedules, setLocalSchedules] = React.useState<Seller[]>([]);
    const [shiftDefinitions, setShiftDefinitions] = React.useState<ShiftDefinition[]>([]);
    
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const shiftsCollectionPath = `artifacts/${appId}/public/data/shiftDefinitions`;

    React.useEffect(() => {
        if (isAuthReady) {
            setLocalSchedules(JSON.parse(JSON.stringify(sellers)));
            setIsLoading(false);
        }
    }, [sellers, isAuthReady]);

    // Carrega e sincroniza as definições de turnos
    React.useEffect(() => {
        if (!isAuthReady) return;
        const shiftsRef = collection(db, shiftsCollectionPath);
        const unsubscribe = onSnapshot(shiftsRef, (snapshot) => {
            const loadedShifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftDefinition));
            setShiftDefinitions(loadedShifts);
        });
        return () => unsubscribe();
    }, [isAuthReady, shiftsCollectionPath]);

    const handleScheduleChange = (sellerId: string, dayKey: string, newShiftName: string) => {
        setLocalSchedules(prevSchedules => 
            prevSchedules.map(seller => 
                seller.id === sellerId 
                ? { ...seller, workSchedule: { ...seller.workSchedule, [dayKey]: newShiftName } } 
                : seller
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const promises = localSchedules.map(seller => {
                const sellerRef = doc(db, 'sellers', seller.id);
                return updateDoc(sellerRef, { workSchedule: seller.workSchedule || {} });
            });
            await Promise.all(promises);
            setSellers(() => localSchedules);
            toast({ title: "Escala Salva!", description: "A escala de trabalho foi atualizada com sucesso." });
        } catch (error) {
            console.error("Erro ao salvar a escala:", error);
            toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível atualizar a escala." });
        } finally {
            setIsSaving(false);
        }
    };

    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    const handlePreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <CalendarDays className="size-8 text-primary" />
                    <h1 className="text-3xl font-bold">Escala de Trabalho</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousWeek}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Semana de {format(start, "dd 'de' MMMM", { locale: ptBR })} a {format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
                            <CardDescription>Defina os turnos de trabalho para cada vendedor.</CardDescription>
                        </div>
                        <div className="flex gap-2 mt-4 sm:mt-0">
                            <ShiftManagementDialog definitions={shiftDefinitions} collectionPath={shiftsCollectionPath} />
                            <Button onClick={handleSaveChanges} disabled={isSaving || isLoading || localSchedules.length === 0}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : localSchedules.length === 0 ? (
                        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                            <Users className="mx-auto h-12 w-12" />
                            <p className="mt-4 font-semibold">Nenhum vendedor encontrado</p>
                            <p className="text-sm">Vá para Configurações > Vendedores para adicionar um novo vendedor.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold min-w-[180px]">Vendedor</TableHead>
                                        {weekDays.map(day => <TableHead key={day.key} className="text-center font-semibold">{day.label}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localSchedules.map(seller => (
                                        <TableRow key={seller.id}>
                                            <TableCell className="font-medium">{seller.name}</TableCell>
                                            {weekDays.map(day => {
                                                const shiftName = seller.workSchedule?.[day.key] || 'N/D';
                                                return (
                                                    <TableCell key={day.key} className="text-center min-w-[140px]">
                                                        <Select value={shiftName} onValueChange={(newShift) => handleScheduleChange(seller.id, day.key, newShift)}>
                                                            <SelectTrigger className={cn("w-full h-9 text-xs", getShiftClass(shiftName, shiftDefinitions))}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="N/D">N/D</SelectItem>
                                                                {shiftDefinitions.map(def => <SelectItem key={def.id} value={def.name}>{def.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- Componente do Modal de Gestão de Turnos ---
function ShiftManagementDialog({ definitions, collectionPath }: { definitions: ShiftDefinition[], collectionPath: string }) {
    const [localDefs, setLocalDefs] = React.useState(definitions);
    const [newShift, setNewShift] = React.useState({ name: '', time: '', color: 'blue' });
    const { toast } = useToast();

    React.useEffect(() => {
        setLocalDefs(definitions);
    }, [definitions]);

    const handleAddShift = async () => {
        if (!newShift.name || !newShift.time) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios' });
            return;
        }
        try {
            await addDoc(collection(db, collectionPath), newShift);
            setNewShift({ name: '', time: '', color: 'blue' });
            toast({ title: 'Turno adicionado!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar turno' });
        }
    };
    
    const handleUpdateShift = async (id: string, field: keyof Omit<ShiftDefinition, 'id'>, value: string) => {
        const shiftRef = doc(db, collectionPath, id);
        try {
            await updateDoc(shiftRef, { [field]: value });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro ao atualizar turno' });
        }
    };

    const handleDeleteShift = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este turno?')) {
            try {
                await deleteDoc(doc(db, collectionPath, id));
                toast({ title: 'Turno excluído!' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao excluir turno' });
            }
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Gerir Turnos</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Gerir Turnos de Trabalho</DialogTitle>
                    <DialogDescription>Crie, edite ou exclua os turnos disponíveis para a escala.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {localDefs.map((def) => (
                        <div key={def.id} className="flex items-center gap-2">
                            <Input value={def.name} onChange={(e) => handleUpdateShift(def.id, 'name', e.target.value)} placeholder="Nome do Turno" />
                            <Input value={def.time} onChange={(e) => handleUpdateShift(def.id, 'time', e.target.value)} placeholder="Horário (ex: 08:00-14:00)" />
                            <Select value={def.color} onValueChange={(color) => handleUpdateShift(def.id, 'color', color)}>
                                <SelectTrigger className={cn("w-[120px]", shiftColors[def.color])}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(shiftColors).map(color => (
                                        <SelectItem key={color} value={color}><div className="flex items-center gap-2"><div className={cn("w-3 h-3 rounded-full", shiftColors[color])} />{color}</div></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteShift(def.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <div className="flex items-end gap-2 pt-4 border-t">
                        <div className="grid gap-1.5 flex-grow"><Label>Novo Turno</Label><Input placeholder="Nome" value={newShift.name} onChange={(e) => setNewShift(s => ({...s, name: e.target.value}))} /></div>
                        <div className="grid gap-1.5 flex-grow"><Label>Horário</Label><Input placeholder="08:00-14:00" value={newShift.time} onChange={(e) => setNewShift(s => ({...s, time: e.target.value}))} /></div>
                        <Button onClick={handleAddShift}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
