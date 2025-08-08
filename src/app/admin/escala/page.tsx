"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"; // Ajuste o caminho se necessário

// Definição do tipo para os dados de turno
type ShiftDefinition = {
    id: number;
    name: string;
    entryTime: string;
    lunchTime: string;
    exitTime: string;
};

export default function EscalaPage() {
    const [definitions, setDefinitions] = useState<ShiftDefinition[]>([]);

    // Carrega dados iniciais (simulação)
    useEffect(() => {
        const initialData: ShiftDefinition[] = [
            { id: 1, name: 'Turno Padrão', entryTime: '08:00', lunchTime: '12:00-13:00', exitTime: '18:00' },
        ];
        setDefinitions(initialData);
    }, []);

    // Função de atualização
    const handleUpdateShift = (id: number, field: keyof ShiftDefinition, value: string) => {
        setDefinitions(currentDefs =>
            currentDefs.map(def =>
                def.id === id ? { ...def, [field]: value } : def
            )
        );
        console.log(`ID: ${id}, Campo: ${field}, Valor: ${value}`);
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Definições de Escala</h1>
            <div className="space-y-4">
                 <div className="grid grid-cols-7 items-center gap-2 font-semibold px-2">
                    <div className="col-span-2">Nome do Turno</div>
                    <div>Entrada</div>
                    <div>Almoço</div>
                    <div>Saída</div>
                </div>
                {definitions.map((def) => (
                    <div key={def.id} className="grid grid-cols-7 items-center gap-2">
                        {/* --- CÓDIGO CORRIGIDO USANDO (e.target as any) --- */}
                        <Input
                            className="col-span-2"
                            defaultValue={def.name}
                            onBlur={(e) => handleUpdateShift(def.id, 'name', (e.target as any).value)}
                        />
                        <Input
                            type="time"
                            defaultValue={def.entryTime}
                            onBlur={(e) => handleUpdateShift(def.id, 'entryTime', (e.target as any).value)}
                        />
                        <Input
                            defaultValue={def.lunchTime}
                            onBlur={(e) => handleUpdateShift(def.id, 'lunchTime', (e.target as any).value)}
                            placeholder="ex: 12:00-13:00"
                        />
                        <Input
                            type="time"
                            defaultValue={def.exitTime}
                            onBlur={(e) => handleUpdateShift(def.id, 'exitTime', (e.target as any).value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}