'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, Copy, Loader2, Save, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/contexts/AdminContext';
import { addDays, startOfWeek, format, getISOWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, collection, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { httpsCallable } from 'firebase/functions';
import { cn } from '@/lib/client-utils';

type Shift = { id: string; name: string; entryTime: string; exitTime: string; lunchTime: string; };
type Schedule = { [sellerId: string]: { [dayIndex: number]: string | 'off'; } };

// --- Sub-componente: Modal de Definição de Turnos ---
const ShiftDefinitionsModal = ({ shifts, setShifts }: { shifts: Shift[], setShifts: React.Dispatch<React.SetStateAction<Shift[]>> }) => {
    const { toast } = useToast();
    const shiftsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default'}/public/data/shiftDefinitions`;

    const handleSave = async () => {
        const batch = writeBatch(db);
        shifts.forEach(shift => {
            const ref = doc(db, shiftsCollectionPath, shift.id);
            batch.set(ref, { name: shift.name, entryTime: shift.entryTime, exitTime: shift.exitTime, lunchTime: shift.lunchTime });
        });
        await batch.commit();
        toast({ title: "Sucesso", description: "Turnos atualizados." });
    };

    const handleAdd = () => setShifts(prev => [...prev, { id: doc(collection(db, 'temp_ids')).id, name: "Novo Turno", entryTime: "09:00", exitTime: "18:00", lunchTime: "12:00-13:00" }]);
    
    const handleDelete = async (id: string) => {
        await deleteDoc(doc(db, shiftsCollectionPath, id));
        setShifts(prev => prev.filter(s => s.id !== id));
        toast({ title: "Sucesso", description: "Turno removido." });
    };

    const handleUpdate = (id: string, field: keyof Shift, value: string) => {
        setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Settings className="mr-2" />Gerir Turnos</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Definições de Turnos</DialogTitle><DialogDescription>Crie e gira os turnos disponíveis.</DialogDescription></DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {shifts.map(shift => (
                        <div key={shift.id} className="grid grid-cols-4 gap-2 items-center">
                            <Input value={shift.name} onChange={e => handleUpdate(shift.id, 'name', e.target.value)} placeholder="Nome" />
                            <Input type="time" value={shift.entryTime} onChange={e => handleUpdate(shift.id, 'entryTime', e.target.value)} />
                            <Input value={shift.lunchTime} onChange={e => handleUpdate(shift.id, 'lunchTime', e.target.value)} placeholder="Almoço" />
                            <div className="flex items-center gap-1">
                                <Input type="time" value={shift.exitTime} onChange={e => handleUpdate(shift.id, 'exitTime', e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)}><Trash2 className="text-red-500" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleAdd}><PlusCircle className="mr-2" />Adicionar</Button>
                    <Button onClick={handleSave}><Save className="mr-2" />Salvar Turnos</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Componente Principal ---
export default function EscalaPage() {
    const { sellers, isAuthReady } = useAdminContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [schedule, setSchedule] = useState<Schedule>({});
    const [savedSchedule, setSavedSchedule] = useState<Schedule>({}); // Estado para comparar alterações
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const weekIdentifier = useMemo(() => `${getYear(currentDate)}-W${getISOWeek(currentDate)}`, [currentDate]);

    const handleDateChange = (days: number) => setCurrentDate(prev => addDays(prev, days));

    // Carrega dados da página (escala e turnos) de forma unificada
    useEffect(() => {
        const loadPageData = async () => {
            setIsLoading(true);
            try {
                const callable = httpsCallable(functions, 'api');
                const result = await callable({ action: 'getSchedulePageData', weekIdentifier });
                const { schedule: loadedSchedule, shifts: loadedShifts } = result.data as { schedule: Schedule, shifts: Shift[] };
                setSchedule(loadedSchedule || {});
                setSavedSchedule(loadedSchedule || {}); // Guarda o estado original
                setShifts(loadedShifts || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao carregar dados da escala', description: String(error) });
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthReady) {
            loadPageData();
        }
    }, [weekIdentifier, toast, isAuthReady]);

    const handleScheduleChange = (sellerId: string, dayIndex: number, value: string) => {
        setSchedule(prev => ({
            ...prev,
            [sellerId]: { ...prev[sellerId], [dayIndex]: value }
        }));
    };

    const handleSaveChanges = useCallback(async () => {
        setIsSaving(true);
        try {
            const callable = httpsCallable(functions, 'api');
            await callable({ action: 'setWorkSchedule', weekIdentifier, schedule });
            setSavedSchedule(schedule); // Atualiza o estado original após salvar
            toast({ title: 'Sucesso!', description: 'Escala salva com sucesso.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar escala', description: String(error) });
        } finally {
            setIsSaving(false);
        }
    }, [schedule, weekIdentifier, toast]);

    const handleCopyWeek = useCallback(async () => {
        const lastWeekDate = addDays(currentDate, -7);
        const lastWeekIdentifier = `${getYear(lastWeekDate)}-W${getISOWeek(lastWeekDate)}`;
        
        try {
            const callable = httpsCallable(functions, 'api');
            const result = await callable({ action: 'getSchedulePageData', weekIdentifier: lastWeekIdentifier });
            const { schedule: lastWeekSchedule } = result.data as { schedule: Schedule, shifts: Shift[] };

            if (Object.keys(lastWeekSchedule).length > 0) {
                setSchedule(lastWeekSchedule);
                toast({ title: 'Escala Copiada', description: 'A escala da semana anterior foi carregada. Salve para confirmar.' });
            } else {
                toast({ variant: 'default', title: 'Nada a copiar', description: 'Não há escala definida para a semana anterior.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao copiar escala', description: String(error) });
        }
    }, [currentDate, toast]);

    const isCellDirty = (sellerId: string, dayIndex: number): boolean => {
        const originalValue = savedSchedule[sellerId]?.[dayIndex] || 'off';
        const currentValue = schedule[sellerId]?.[dayIndex] || 'off';
        return originalValue !== currentValue;
    };

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [currentDate]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Escala de Trabalho</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(-7)}><ChevronLeft /></Button>
                    <span className="text-lg font-semibold w-56 text-center">{format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd 'de' MMM", { locale: ptBR })} - {format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(7)}><ChevronRight /></Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyWeek}><Copy className="mr-2" />Copiar Semana</Button>
                    <ShiftDefinitionsModal shifts={shifts} setShifts={setShifts} />
                    <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}Salvar</Button>
                </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-3 text-left font-semibold">Vendedor</th>
                            {weekDays.map(day => <th key={day.toISOString()} className="p-3 text-center font-semibold">{format(day, 'EEE, dd/MM', { locale: ptBR })}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center p-8"><Loader2 className="mx-auto animate-spin text-primary" size={32} /></td></tr>
                        ) : sellers.length > 0 ? (
                            sellers.map(seller => (
                                <tr key={seller.id} className="border-b">
                                    <td className="p-3 font-medium">{seller.name}</td>
                                    {weekDays.map((day, dayIndex) => (
                                        <td key={day.toISOString()} className="p-2">
                                            <Select
                                                value={schedule[seller.id]?.[dayIndex] || 'off'}
                                                onValueChange={(value) => handleScheduleChange(seller.id, dayIndex, value)}
                                            >
                                                <SelectTrigger className={cn(isCellDirty(seller.id, dayIndex) && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}>
                                                    <SelectValue placeholder="Definir..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="off">Folga</SelectItem>
                                                    {shifts.length > 0 && <SelectSeparator />}
                                                    {shifts.map(shift => <SelectItem key={shift.id} value={shift.id}>{shift.name} ({shift.entryTime} - {shift.exitTime})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">Nenhum vendedor encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
