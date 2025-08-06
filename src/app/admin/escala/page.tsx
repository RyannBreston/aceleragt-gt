'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, ChevronLeft, ChevronRight, Save, Loader2, Users, Settings, PlusCircle, Trash2, CalendarIcon } from "lucide-react";
import { useAdminContext } from '@/contexts/AdminContext';
import { addDays, startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Seller } from '@/lib/types';
import { doc, updateDoc, collection, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Tipos e Constantes Atualizadas ---
interface ShiftDefinition {
    id: string;
    name: string;
    entryTime: string;
    lunchTime: string;
    exitTime: string;
    color: string;
}

const weekDays = [
    { key: 'seg', label: 'Segunda' }, { key: 'ter', label: 'Terça' }, { key: 'qua', label: 'Quarta' },
    { key: 'qui', label: 'Quinta' }, { key: 'sex', label: 'Sexta' }, { key: 'sab', label: 'Sábado' }, { key: 'dom', label: 'Domingo' },
];
const weekDayKeys = weekDays.map(d => d.key);

const shiftColors: { [key: string]: string } = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const getShiftClass = (shiftName?: string, definitions?: ShiftDefinition[]) => {
    const shift = definitions?.find(d => d.name === shiftName);
    if (shift?.color && shiftColors[shift.color]) return shiftColors[shift.color];
    return 'bg-muted/50 text-muted-foreground border-transparent';
};

// --- Sub-componente: Gestão de Tipos de Turno (Melhorado) ---
function ShiftManagementDialog({ definitions, collectionPath }: { definitions: ShiftDefinition[], collectionPath: string }) {
    const [newShift, setNewShift] = React.useState<Omit<ShiftDefinition, 'id'>>({ name: '', entryTime: '', lunchTime: '', exitTime: '', color: 'blue' });
    const { toast } = useToast();

    const handleAddShift = async () => {
        if (!newShift.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome do turno é obrigatório' });
            return;
        }
        await addDoc(collection(db, collectionPath), newShift);
        setNewShift({ name: '', entryTime: '', lunchTime: '', exitTime: '', color: 'blue' });
        toast({ title: 'Turno adicionado!' });
    };
    
    const handleUpdateShift = async (id: string, field: keyof Omit<ShiftDefinition, 'id'>, value: string) => {
        await updateDoc(doc(db, collectionPath, id), { [field]: value });
    };

    const handleDeleteShift = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este turno?')) {
            await deleteDoc(doc(db, collectionPath, id));
            toast({ title: 'Turno excluído!' });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Gerir Turnos</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle>Gerir Tipos de Turno</DialogTitle>
                    <DialogDescription>Crie, edite ou exclua os turnos (ex: Manhã, Tarde, Folga).</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-muted-foreground px-2">
                        <div className="col-span-2">Nome do Turno</div>
                        <div>Entrada</div>
                        <div>Almoço/Intervalo</div>
                        <div>Saída</div>
                        <div>Cor</div>
                    </div>
                    {definitions.map((def) => (
                        <div key={def.id} className="grid grid-cols-6 items-center gap-2">
                            <Input className="col-span-2" defaultValue={def.name} onBlur={(e) => handleUpdateShift(def.id, 'name', e.target.value)} />
                            <Input type="time" defaultValue={def.entryTime} onBlur={(e) => handleUpdateShift(def.id, 'entryTime', e.target.value)} />
                            <Input defaultValue={def.lunchTime} onBlur={(e) => handleUpdateShift(def.id, 'lunchTime', e.target.value)} placeholder="ex: 12:00-13:00"/>
                            <Input type="time" defaultValue={def.exitTime} onBlur={(e) => handleUpdateShift(def.id, 'exitTime', e.target.value)} />
                            <Select value={def.color} onValueChange={(color) => handleUpdateShift(def.id, 'color', color)}>
                                <SelectTrigger className={cn("w-full", shiftColors[def.color])}><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.keys(shiftColors).map(color => (<SelectItem key={color} value={color}><div className="flex items-center gap-2"><div className={cn("w-3 h-3 rounded-full", shiftColors[color])} />{color}</div></SelectItem>))}</SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteShift(def.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <div className="grid grid-cols-6 items-end gap-2 pt-4 border-t">
                        <Input className="col-span-2" placeholder="Nome (ex: Folga)" value={newShift.name} onChange={(e) => setNewShift(s => ({...s, name: e.target.value}))} />
                        <Input type="time" value={newShift.entryTime} onChange={(e) => setNewShift(s => ({...s, entryTime: e.target.value}))} />
                        <Input placeholder="-" value={newShift.lunchTime} onChange={(e) => setNewShift(s => ({...s, lunchTime: e.target.value}))} />
                        <Input type="time" value={newShift.exitTime} onChange={(e) => setNewShift(s => ({...s, exitTime: e.target.value}))} />
                        <Button onClick={handleAddShift} className="col-span-2"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Componente Principal da Página ---
export default function AdminWorkSchedulePage() {
    const { sellers, setSellers, isAuthReady } = useAdminContext();
    const { toast } = useToast();
    
    const [localSchedules, setLocalSchedules] = React.useState<Seller[]>([]);
    const [shiftDefinitions, setShiftDefinitions] = React.useState<ShiftDefinition[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    
    const [repeatModalOpen, setRepeatModalOpen] = React.useState(false);
    const [repeatConfig, setRepeatConfig] = React.useState<{ sellerId: string; shiftName: string; originDay: string } | null>(null);
    const [daysToRepeat, setDaysToRepeat] = React.useState<string[]>([]);
    
    const shiftsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/shiftDefinitions`;

    React.useEffect(() => {
        if (isAuthReady) {
            setLocalSchedules(JSON.parse(JSON.stringify(sellers)));
            setIsLoading(false);
        }
    }, [sellers, isAuthReady]);

    React.useEffect(() => {
        if (!isAuthReady) return;
        const unsubscribe = onSnapshot(collection(db, shiftsCollectionPath), (snapshot) => {
            setShiftDefinitions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftDefinition)));
        });
        return () => unsubscribe();
    }, [isAuthReady, shiftsCollectionPath]);

    const handleScheduleChange = (sellerId: string, dayKey: string, newShiftName: string) => {
        setLocalSchedules(prev => prev.map(s => s.id === sellerId ? { ...s, workSchedule: { ...s.workSchedule, [dayKey]: newShiftName } } : s));
        setRepeatConfig({ sellerId, shiftName: newShiftName, originDay: dayKey });
        setDaysToRepeat([]);
        setRepeatModalOpen(true);
    };

    const handleApplyRepetition = () => {
        if (!repeatConfig) return;
        const { sellerId, shiftName } = repeatConfig;
        setLocalSchedules(prev => prev.map(seller => {
            if (seller.id === sellerId) {
                const newWorkSchedule = { ...seller.workSchedule };
                daysToRepeat.forEach(dayKey => { newWorkSchedule[dayKey] = shiftName; });
                return { ...seller, workSchedule: newWorkSchedule };
            }
            return seller;
        }));
        toast({ title: "Turnos aplicados!" });
        setRepeatModalOpen(false);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await Promise.all(localSchedules.map(seller => 
                updateDoc(doc(db, 'sellers', seller.id), { workSchedule: seller.workSchedule || {} })
            ));
            setSellers(() => localSchedules);
            toast({ title: "Escala Salva com sucesso!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao Salvar" });
        } finally {
            setIsSaving(false);
        }
    };

    const weekDates = React.useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    }, [currentDate]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4"><CalendarDays className="size-8 text-primary" /><h1 className="text-3xl font-bold">Escala de Trabalho</h1></div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-[240px] justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div><CardTitle>Semana de {format(weekDates[0], "dd/MM")} a {format(weekDates[6], "dd/MM/yyyy")}</CardTitle><CardDescription>Defina os turnos de trabalho para cada vendedor.</CardDescription></div>
                        <div className="flex gap-2"><ShiftManagementDialog definitions={shiftDefinitions} collectionPath={shiftsCollectionPath} /><Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar</Button></div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : 
                    localSchedules.length === 0 ? (<div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12"><Users className="mx-auto h-12 w-12" /><p className="mt-4 font-semibold">Nenhum vendedor encontrado</p></div>) : 
                    (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead className="font-semibold min-w-[180px] sticky left-0 bg-card z-10">Vendedor</TableHead>{weekDates.map((date, index) => <TableHead key={index} className="text-center font-semibold">{format(date, "EEE dd/MM", { locale: ptBR })}</TableHead>)}</TableRow></TableHeader>
                                <TableBody>
                                    {localSchedules.map(seller => (
                                        <TableRow key={seller.id}>
                                            <TableCell className="font-medium sticky left-0 bg-card z-10">{seller.name}</TableCell>
                                            {weekDayKeys.map(dayKey => {
                                                const shiftName = seller.workSchedule?.[dayKey] || 'N/D';
                                                const shiftDef = shiftDefinitions.find(d => d.name === shiftName);
                                                return (
                                                    <TableCell key={dayKey} className="text-center min-w-[150px]">
                                                        <TooltipProvider delayDuration={100}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div>
                                                                        <Select value={shiftName} onValueChange={(newShift) => handleScheduleChange(seller.id, dayKey, newShift)}>
                                                                            <SelectTrigger className={cn("w-full h-9 text-xs border-2", getShiftClass(shiftName, shiftDefinitions))}><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="N/D">N/D</SelectItem>
                                                                                {shiftDefinitions.filter(def => def.name?.trim()).map(def => <SelectItem key={def.id} value={def.name}>{def.name}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                {shiftDef && <TooltipContent className="text-xs space-y-1"><p>Entrada: {shiftDef.entryTime || '--:--'}</p><p>Almoço: {shiftDef.lunchTime || '-'}</p><p>Saída: {shiftDef.exitTime || '--:--'}</p></TooltipContent>}
                                                            </Tooltip>
                                                        </TooltipProvider>
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

            <Dialog open={repeatModalOpen} onOpenChange={setRepeatModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Repetir este turno?</DialogTitle>
                        <DialogDescription>Você definiu o turno <span className="font-bold text-primary">{repeatConfig?.shiftName}</span>. Selecione os outros dias para aplicar este mesmo turno.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
                        {weekDays.map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox id={`repeat-${key}`} disabled={key === repeatConfig?.originDay} onCheckedChange={(checked) => setDaysToRepeat(p => checked ? [...p, key] : p.filter(d => d !== key))} /><Label htmlFor={`repeat-${key}`}>{label}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRepeatModalOpen(false)}>Apenas este dia</Button>
                        <Button onClick={handleApplyRepetition} disabled={daysToRepeat.length === 0}>Aplicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}