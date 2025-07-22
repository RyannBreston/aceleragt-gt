'use client';

import React, { useState, useEffect } from "react"; // 'useState' adicionado aqui
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw, AlertTriangle, Loader2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from '@/contexts/AdminContext';
import type { Goals, Seller } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, updateDoc } from "firebase/firestore";

// --- Esquema de Validação com Zod ---
const goalLevelSchema = z.object({
  threshold: z.coerce.number().min(0, "Deve ser >= 0"),
  prize: z.coerce.number().min(0, "Deve ser >= 0"),
});

const sellerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  salesValue: z.coerce.number().min(0, "Deve ser >= 0"),
  ticketAverage: z.coerce.number().min(0, "Deve ser >= 0"),
  pa: z.coerce.number().min(0, "Deve ser >= 0"),
  points: z.coerce.number().min(0),
  extraPoints: z.coerce.number().min(0, "Deve ser >= 0"),
  completedCourseIds: z.array(z.string()).optional(),
  workSchedule: z.record(z.string()).optional(),
});

const formSchema = z.object({
  sellers: z.array(sellerSchema),
  goals: z.object({
    salesValue: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    ticketAverage: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    pa: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    points: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
  }),
});

type FormData = z.infer<typeof formSchema>;

const goalLevels: Array<{key: keyof z.infer<typeof goalLevelSchema>, label: string}> = [
    { key: 'metinha', label: 'Metinha'}, { key: 'meta', label: 'Meta'},
    { key: 'metona', label: 'Metona'}, { key: 'lendaria', label: 'Lendária'},
];

export default function SettingsPage() {
  const { sellers: contextSellers, goals: contextGoals, setSellers, setGoals, setIsDirty } = useAdminContext();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellers: [],
      goals: contextGoals,
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "sellers",
  });

  useEffect(() => {
    if (contextSellers.length > 0 && contextGoals) {
      const sellersWithNumbers = contextSellers.map(s => ({
        ...s,
        salesValue: Number(s.salesValue) || 0,
        ticketAverage: Number(s.ticketAverage) || 0,
        pa: Number(s.pa) || 0,
        points: Number(s.points) || 0,
        extraPoints: Number(s.extraPoints) || 0,
      }));
      form.reset({ sellers: sellersWithNumbers, goals: contextGoals });
    }
  }, [contextSellers, contextGoals, form]);

  useEffect(() => {
    setIsDirty(form.formState.isDirty);
  }, [form.formState.isDirty, setIsDirty]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const sellerPromises = data.sellers.map(seller => {
        const sellerRef = doc(db, 'sellers', seller.id);
        return setDoc(sellerRef, seller, { merge: true });
      });

      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const goalsDocPath = `artifacts/${appId}/public/data/goals`;
      const goalsRef = doc(db, goalsDocPath, 'main');
      const goalsPromise = setDoc(goalsRef, data.goals);

      await Promise.all([...sellerPromises, goalsPromise]);

      setSellers(() => data.sellers as Seller[]);
      setGoals(() => data.goals as Goals);
      
      toast({ title: "Alterações Salvas!", description: "Suas configurações foram atualizadas com sucesso." });
      form.reset(data);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Salvar" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndCycle = async () => {
    if (form.formState.isDirty) {
        toast({ variant: "destructive", title: "Alterações Pendentes", description: "Salve suas alterações antes de finalizar o ciclo."});
        return;
    }
    // Lógica para finalizar o ciclo...
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Shield className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">Configurações Gerais</h1>
        </div>
        {form.formState.isDirty && (
            <div className="flex items-center gap-2 animate-pulse">
                <span className="text-yellow-400 font-semibold">Alterações não salvas</span>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving || !form.formState.isValid}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Tudo
                </Button>
            </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="lancamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="ciclo">Ciclo</TabsTrigger>
          </TabsList>

          <TabsContent value="lancamentos" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Lançamento de Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>Vendas (R$)</TableHead><TableHead>Ticket Médio (R$)</TableHead><TableHead>PA</TableHead><TableHead>Pontos Extras</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell><Input type="number" {...form.register(`sellers.${index}.salesValue`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.sellers?.[index]?.salesValue?.message}</p></TableCell>
                        <TableCell><Input type="number" {...form.register(`sellers.${index}.ticketAverage`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.sellers?.[index]?.ticketAverage?.message}</p></TableCell>
                        <TableCell><Input type="number" step="0.1" {...form.register(`sellers.${index}.pa`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.sellers?.[index]?.pa?.message}</p></TableCell>
                        <TableCell><Input type="number" {...form.register(`sellers.${index}.extraPoints`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.sellers?.[index]?.extraPoints?.message}</p></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metas" className="mt-6 space-y-6">
            <Card><CardHeader><CardTitle>Metas de Performance e Prémios</CardTitle></CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {(Object.keys(form.getValues('goals')) as Array<keyof Goals>).filter(k => k !== 'gamification').map((goalKey) => (
                        <div key={goalKey} className="space-y-3 pt-4 border-t first:border-t-0 first:pt-0">
                            <h3 className="text-lg font-semibold capitalize">{goalKey.replace('Value', ' de Venda')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(Object.keys(form.getValues(`goals.${goalKey}`)) as Array<keyof GoalLevels>).map(level => (
                                    <div key={level} className="space-y-2 p-3 border rounded-md">
                                        <h4 className="font-medium capitalize">{level}</h4>
                                        <div><Label>Meta</Label><Input type="number" {...form.register(`goals.${goalKey}.${level}.threshold`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.goals?.[goalKey]?.[level]?.threshold?.message}</p></div>
                                        <div><Label>Prémio (R$)</Label><Input type="number" {...form.register(`goals.${goalKey}.${level}.prize`)} /><p className="text-xs text-destructive mt-1">{form.formState.errors.goals?.[goalKey]?.[level]?.prize?.message}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ciclo" className="mt-6">
            <Card>
                <CardHeader><CardTitle>Gestão de Ciclo</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <div className="flex items-start gap-4">
                        <AlertTriangle className="size-6 text-destructive mt-1" />
                        <div>
                            <h4 className="font-semibold text-destructive">Ação Irreversível</h4>
                            <p className="text-sm text-destructive/80 mt-1">Ao finalizar o ciclo, os dados serão zerados e o estado atual salvo no histórico.</p>
                            <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4"><RefreshCw className="mr-2" />Finalizar Ciclo</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar Finalização?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleEndCycle}>Sim, finalizar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}