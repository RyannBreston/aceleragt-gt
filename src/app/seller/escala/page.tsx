'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, Coffee, Moon, Sun } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { addDays, startOfWeek, endOfWeek, format, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// --- Tipos e Constantes ---
interface ShiftDefinition {
    id: string;
    name: string;
    entryTime: string;
    lunchTime: string;
    exitTime: string;
    color: string;
    time?: string; // Adicionado para flexibilidade
}

const weekDayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const shiftColors: { [key: string]: string } = {
    blue: 'bg-blue-500/10 text-blue-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    pink: 'bg-pink-500/10 text-pink-400',
    gray: 'bg-gray-500/10 text-gray-400',
};

// --- Sub-componente: Card do Dia Atual ---
const TodayScheduleCard = ({ date, shiftDef }: { date: Date; shiftDef?: ShiftDefinition }) => (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-lg border-2 border-primary animate-fade-in">
        <CardHeader>
            <CardTitle className="text-2xl">O Seu Horário de Hoje</CardTitle>
            <CardDescription>{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6">
            {shiftDef ? (
                <>
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <p className="text-4xl font-bold">{shiftDef.name}</p>
                        <p className={cn("text-lg font-semibold", shiftColors[shiftDef.color]?.replace('bg-', 'text-'))}>{shiftDef.time || "Horário não definido"}</p>
                    </div>
                    <div className="flex gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2"><Sun className="size-5 text-amber-500" /> <div><p className="text-xs">Entrada</p><p className="font-semibold">{shiftDef.entryTime || '--:--'}</p></div></div>
                        <div className="flex items-center gap-2"><Coffee className="size-5 text-orange-500" /> <div><p className="text-xs">Almoço</p><p className="font-semibold">{shiftDef.lunchTime || '--'}</p></div></div>
                        <div className="flex items-center gap-2"><Moon className="size-5 text-indigo-400" /> <div><p className="text-xs">Saída</p><p className="font-semibold">{shiftDef.exitTime || '--:--'}</p></div></div>
                    </div>
                </>
            ) : (
                <div className="text-center w-full">
                    <p className="text-2xl font-bold text-muted-foreground">Dia de Folga</p>
                    <p className="text-sm">Aproveite para descansar!</p>
                </div>
            )}
        </CardContent>
    </Card>
);

// --- Sub-componente: Item de Lista para os Próximos Dias ---
const UpcomingDayItem = ({ date, shiftDef }: { date: Date; shiftDef?: ShiftDefinition }) => (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
        <div>
            <p className="font-bold text-lg capitalize">{format(date, "EEEE", { locale: ptBR })}</p>
            <p className="text-sm text-muted-foreground">{format(date, "dd/MM")}</p>
        </div>
        {shiftDef ? (
            <div className={cn("text-right px-3 py-1 rounded-md text-sm", shiftColors[shiftDef.color])}>
                <p className="font-semibold">{shiftDef.name}</p>
                <p className="text-xs">{shiftDef.time || `${shiftDef.entryTime} - ${shiftDef.exitTime}`}</p>
            </div>
        ) : (
            <p className="text-sm font-semibold text-muted-foreground">Folga / N/D</p>
        )}
    </div>
);


// --- Componente Principal da Página ---
export default function SellerWorkSchedulePage() {
    const { currentSeller, isAuthReady } = useSellerContext();
    const [shiftDefinitions, setShiftDefinitions] = React.useState<ShiftDefinition[]>([]);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [isLoadingDefinitions, setIsLoadingDefinitions] = React.useState(true);

    const shiftsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/shiftDefinitions`;

    React.useEffect(() => {
        const shiftsRef = collection(db, shiftsCollectionPath);
        const unsubscribe = onSnapshot(shiftsRef, (snapshot) => {
            setShiftDefinitions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftDefinition)));
            setIsLoadingDefinitions(false);
        });
        return () => unsubscribe();
    }, [shiftsCollectionPath]);
    
    const weekDates = React.useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    }, [currentDate]);

    if (!isAuthReady || !currentSeller || isLoadingDefinitions) {
        return <DashboardSkeleton />;
    }

    const sellerSchedule = currentSeller.workSchedule || {};
    const todayIndex = weekDates.findIndex(date => isToday(date));

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <CalendarDays className="size-8 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold">Minha Escala de Trabalho</h1>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="w-40 text-center font-semibold text-muted-foreground">
                        {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {todayIndex !== -1 ? (
                        <TodayScheduleCard 
                            date={weekDates[todayIndex]}
                            shiftDef={shiftDefinitions.find(d => d.name === sellerSchedule[weekDayKeys[todayIndex]])}
                        />
                    ) : (
                        <Card className="flex items-center justify-center h-full p-8">
                            <CardContent>
                                <p className="text-center text-muted-foreground">A sua escala para a semana atual não inclui o dia de hoje. Navegue para a semana correta.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resto da Semana</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {weekDates.map((date, index) => {
                                if (isToday(date)) return null;
                                
                                const dayKey = weekDayKeys[index];
                                const shiftName = sellerSchedule[dayKey] || 'N/D';
                                const shiftDef = shiftDefinitions.find(d => d.name === shiftName);
                                return <UpcomingDayItem key={dayKey} date={date} shiftDef={shiftDef} />;
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}