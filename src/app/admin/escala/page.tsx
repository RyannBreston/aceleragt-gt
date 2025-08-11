/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, onSnapshot } from "firebase/firestore";

type ShiftDefinition = {
    id: string;
    name: string;
    entryTime: string;
    lunchTime: string;
    exitTime: string;
};

export default function EscalaPage() {
    const [definitions, setDefinitions] = useState<ShiftDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const shiftsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data/shiftDefinitions`;

    useEffect(() => {
        const shiftsRef = collection(db, shiftsCollectionPath);
        const unsubscribe = onSnapshot(shiftsRef, (snapshot) => {
            const loadedDefinitions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftDefinition));
            setDefinitions(loadedDefinitions);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [shiftsCollectionPath]);

    const handleUpdateShift = (id: string, field: keyof ShiftDefinition, value: string) => {
        setDefinitions(currentDefs =>
            currentDefs.map(def =>
                def.id === id ? { ...def, [field]: value } : def
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const batch = writeBatch(db);
        definitions.forEach(def => {
            const docRef = doc(db, shiftsCollectionPath, def.id);
            batch.update(docRef, {
                name: def.name,
                entryTime: def.entryTime,
                lunchTime: def.lunchTime,
                exitTime: def.exitTime,
            });
        });

        try {
            await batch.commit();
            toast({ title: "Sucesso!", description: "As definições de escala foram atualizadas." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar as alterações." });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-8">A carregar...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Definições de Escala</h1>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? "Aguarde..." : "Salvar Alterações"}
                </Button>
            </div>
            <div className="space-y-4">
                 <div className="grid grid-cols-7 items-center gap-2 font-semibold px-2">
                    <div className="col-span-2">Nome do Turno</div>
                    <div>Entrada</div>
                    <div>Almoço</div>
                    <div>Saída</div>
                </div>
                {definitions.map((def) => (
                    <div key={def.id} className="grid grid-cols-7 items-center gap-2">
                        <Input
                            className="col-span-2"
                            value={def.name}
                            onChange={(e) => handleUpdateShift(def.id, 'name', e.target.value)}
                        />
                        <Input
                            type="time"
                            value={def.entryTime}
                            onChange={(e) => handleUpdateShift(def.id, 'entryTime', e.target.value)}
                        />
                        <Input
                            value={def.lunchTime}
                            onChange={(e) => handleUpdateShift(def.id, 'lunchTime', e.target.value)}
                            placeholder="ex: 12:00-13:00"
                        />
                        <Input
                            type="time"
                            value={def.exitTime}
                            onChange={(e) => handleUpdateShift(def.id, 'exitTime', e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
