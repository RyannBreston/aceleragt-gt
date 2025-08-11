/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { PlusCircle, Trash2 } from 'lucide-react';

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

    const handleAddShift = async () => {
        const newShift: Omit<ShiftDefinition, 'id'> = {
            name: 'Novo Turno',
            entryTime: '09:00',
            lunchTime: '13:00-14:00',
            exitTime: '19:00',
        };
        try {
            await addDoc(collection(db, shiftsCollectionPath), newShift);
            toast({ title: "Sucesso!", description: "Novo turno adicionado." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Não foi possível adicionar o novo turno." });
        }
    };

    const handleDeleteShift = async (id: string) => {
        try {
            await deleteDoc(doc(db, shiftsCollectionPath, id));
            toast({ title: "Sucesso!", description: "O turno foi removido." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Não foi possível remover o turno." });
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-8">A carregar...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Definições de Escala</h1>
                <div className="flex gap-2">
                    <Button onClick={handleAddShift} variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Turno</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? "Aguarde..." : "Salvar Alterações"}
                    </Button>
                </div>
            </div>
            <div className="space-y-4">
                 <div className="grid grid-cols-12 items-center gap-2 font-semibold px-2">
                    <div className="col-span-4">Nome do Turno</div>
                    <div className="col-span-2">Entrada</div>
                    <div className="col-span-2">Almoço</div>
                    <div className="col-span-2">Saída</div>
                    <div className="col-span-2 text-right">Ações</div>
                </div>
                {definitions.map((def) => (
                    <div key={def.id} className="grid grid-cols-12 items-center gap-2">
                        <Input
                            className="col-span-4"
                            value={def.name}
                            onChange={(e) => handleUpdateShift(def.id, 'name', e.target.value)}
                        />
                        <Input
                            type="time"
                            className="col-span-2"
                            value={def.entryTime}
                            onChange={(e) => handleUpdateShift(def.id, 'entryTime', e.target.value)}
                        />
                        <Input
                            className="col-span-2"
                            value={def.lunchTime}
                            onChange={(e) => handleUpdateShift(def.id, 'lunchTime', e.target.value)}
                            placeholder="ex: 12:00-13:00"
                        />
                        <Input
                            type="time"
                            className="col-span-2"
                            value={def.exitTime}
                            onChange={(e) => handleUpdateShift(def.id, 'exitTime', e.target.value)}
                        />
                        <div className="col-span-2 flex justify-end">
                             <Button onClick={() => handleDeleteShift(def.id)} variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
