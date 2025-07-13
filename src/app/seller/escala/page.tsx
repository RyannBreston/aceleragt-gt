'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { useSellerContext } from '@/app/seller/layout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const weekDays = [
    { key: 'seg', label: 'Segunda-feira' },
    { key: 'ter', label: 'Terça-feira' },
    { key: 'qua', label: 'Quarta-feira' },
    { key: 'qui', label: 'Quinta-feira' },
    { key: 'sex', label: 'Sexta-feira' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' },
];

const getShiftClass = (shift: string) => {
    switch (shift?.toLowerCase()) {
        case 'manhã': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'tarde': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'integral': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'folga': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        default: return 'bg-muted/50 text-muted-foreground border-transparent';
    }
}

export default function SellerWorkSchedulePage() {
    const { currentSeller } = useSellerContext();
    const today = new Date();
    const todayKey = format(today, 'eee', { locale: ptBR }).toLowerCase();

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <CalendarDays className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Minha Escala de Trabalho</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Escala da Semana</CardTitle>
                    <CardDescription>Seus horários de trabalho para a semana atual.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {weekDays.map(day => {
                            const shift = currentSeller.workSchedule?.[day.key] || 'Não Definido';
                            const isToday = day.key === todayKey;

                            return (
                                <li key={day.key} className={cn("flex items-center justify-between p-4 rounded-lg", isToday ? "bg-primary/10 border-l-4 border-primary" : "bg-muted/50")}>
                                    <span className={cn("font-semibold", isToday && "text-primary")}>{day.label}</span>
                                    <span className={cn("px-3 py-1 text-sm font-bold rounded-full", getShiftClass(shift))}>
                                        {shift}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}