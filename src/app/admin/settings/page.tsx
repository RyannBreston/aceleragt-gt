'use client';

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw, AlertTriangle, Loader2, Save, Puzzle, Target, GraduationCap, ShoppingBag, Trophy, BarChart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from '@/contexts/AdminContext';
import type { Goals, Seller } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, writeBatch } from "firebase/firestore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

// --- Esquema de Validação com Zod (em português e com o novo módulo) ---
const goalLevelSchema = z.object({
  threshold: z.coerce.number().min(0, "O valor deve ser >= 0."),
  prize: z.coerce.number().min(0, "O prémio deve ser >= 0."),
});

const sellerPerformanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  salesValue: z.coerce.number().min(0, "Deve ser positivo."),
  ticketAverage: z.coerce.number().min(0, "Deve ser positivo."),
  pa: z.coerce.number().min(0, "Deve ser positivo."),
  extraPoints: z.coerce.number().min(0, "Deve ser positivo."),
});

const gamificationSchema = z.object({
    missions: z.boolean().default(true),
    academia: z.boolean().default(true),
    quiz: z.boolean().default(true),
    ofertas: z.boolean().default(true),
    loja: z.boolean().default(true),
    ranking: z.boolean().default(true),
});

const formSchema = z.object({
  sellers: z.array(sellerPerformanceSchema),
  goals: z.object({
    salesValue: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    ticketAverage: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    pa: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    points: z.object({ metinha: goalLevelSchema, meta: goalLevelSchema, metona: goalLevelSchema, lendaria: goalLevelSchema }),
    gamification: gamificationSchema,
  }),
});

type FormData = z.infer<typeof formSchema>;
type GoalLevels = keyof FormData['goals']['salesValue'];
type GoalMetric = Exclude<keyof FormData['goals'], 'gamification'>;

// --- Componente de Input de Moeda (Melhorado) ---
const CurrencyInput = React.forwardRef<HTMLInputElement, any>(({ field, ...props }, ref) => {
    const [stringValue, setStringValue] = useState<string>(
      field.value ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
    );

    useEffect(() => {
        setStringValue(field.value ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
    }, [field.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStringValue(value);
    };

    const handleBlur = () => {
        const sanitizedValue = stringValue.replace(/[^0-9,]/g, '').replace(',', '.');
        const numericValue = parseFloat(sanitizedValue) || 0;
        field.onChange(numericValue);
        setStringValue(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    return <Input type="text" {...field} {...props} ref={ref} value={stringValue} onChange={handleChange} onBlur={handleBlur} placeholder="0,00" />;
});
CurrencyInput.displayName = 'CurrencyInput';


// --- Sub-componente: Tabela de Lançamentos de Performance ---
const TabelaDePerformance = ({ control, fields }: { control: any, fields: any[] }) => (
    <Card>
        <CardHeader><CardTitle>Lançamento de Performance</CardTitle><CardDescription>Insira os valores de vendas e outros indicadores para cada vendedor.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>Vendas (R$)</TableHead><TableHead>Ticket Médio (R$)</TableHead><TableHead>PA</TableHead><TableHead>Pontos Extras</TableHead></TableRow></TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.salesValue`} render={({ field }) => <CurrencyInput field={field} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.ticketAverage`} render={({ field }) => <CurrencyInput field={field} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.pa`} render={({ field }) => <Input type="number" step="0.1" {...field} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.extraPoints`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

// --- Sub-componente: Formulário de Metas ---
const FormularioDeMetas = ({ control, getValues }: { control: any, getValues: any }) => {
    const goalMetrics = Object.keys(getValues('goals')).filter(k => k !== 'gamification') as GoalMetric[];
    const goalLevels = Object.keys(getValues('goals.salesValue')) as GoalLevels[];
    const getMetricLabel = (metric: string) => ({ salesValue: 'Vendas', ticketAverage: 'Ticket Médio', pa: 'PA (Peças por Atendimento)', points: 'Pontos' }[metric] || metric);
    return (
        <Card>
            <CardHeader><CardTitle>Metas de Performance e Prémios</CardTitle><CardDescription>Defina os objetivos para cada indicador e o prémio correspondente.</CardDescription></CardHeader>
            <CardContent className="space-y-6 pt-6">
                {goalMetrics.map((metric) => (
                    <div key={metric} className="space-y-3 pt-4 border-t first:border-t-0 first:pt-0">
                        <h3 className="text-lg font-semibold">{getMetricLabel(metric)}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {goalLevels.map(level => (
                                <Card key={level} className="p-4"><h4 className="font-medium capitalize mb-2">{level}</h4><div className="space-y-2">
                                    <FormField control={control} name={`goals.${metric}.${level}.threshold`} render={({ field }) => (<FormItem><FormLabel>Meta</FormLabel><FormControl>{metric === 'salesValue' || metric === 'ticketAverage' ? <CurrencyInput field={field} /> : <Input type="number" {...field} />}</FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`goals.${metric}.${level}.prize`} render={({ field }) => (<FormItem><FormLabel>Prémio (R$)</FormLabel><FormControl><CurrencyInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                </div></Card>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

// --- Sub-componente: Gestão de Módulos ---
const GestaoDeModulos = ({ control }: { control: any }) => {
    const modulos: { name: keyof z.infer<typeof gamificationSchema>, label: string, icon: React.ElementType }[] = [
        { name: 'missions', label: 'Missões', icon: Target },
        { name: 'academia', label: 'Academia', icon: GraduationCap },
        { name: 'quiz', label: 'Quiz', icon: Puzzle },
        { name: 'ofertas', label: 'Ofertas', icon: ShoppingBag },
        { name: 'loja', label: 'Loja de Prémios', icon: Trophy },
        { name: 'ranking', label: 'Meu Desempenho', icon: BarChart },
    ];
    return (
        <Card>
            <CardHeader><CardTitle>Gestão de Módulos</CardTitle><CardDescription>Ative ou desative os módulos que aparecem para os vendedores.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                {modulos.map(({ name, label, icon: Icon }) => (
                    <FormField key={name} control={control} name={`goals.gamification.${name}`} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2"><Icon className="size-5" />{label}</FormLabel>
                                <FormDescription>{field.value ? 'Visível' : 'Oculto'} para os vendedores.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                ))}
            </CardContent>
        </Card>
    );
};

// --- Sub-componente: Gestão de Ciclo ---
const GestaoDeCiclo = ({ onEndCycle, isDirty }: { onEndCycle: () => void; isDirty: boolean; }) => (
    <Card>
        <CardHeader><CardTitle>Gestão de Ciclo</CardTitle><CardDescription>Finalize o ciclo atual para arquivar os resultados e começar um novo.</CardDescription></CardHeader>
        <CardContent>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"><div className="flex items-start gap-4">
                <AlertTriangle className="size-6 text-destructive mt-1" />
                <div>
                    <h4 className="font-semibold text-destructive">Ação Irreversível</h4>
                    <p className="text-sm text-destructive/80 mt-1">Ao finalizar, os dados de performance de todos os vendedores serão zerados. O estado atual será salvo no histórico.</p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4" disabled={isDirty}><RefreshCw className="mr-2" />Finalizar Ciclo</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Tem a certeza que deseja finalizar o ciclo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onEndCycle}>Sim, finalizar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {isDirty && <p className="text-xs text-destructive/80 mt-2">Salve as alterações pendentes para poder finalizar o ciclo.</p>}
                </div>
            </div></div>
        </CardContent>
    </Card>
);

// --- Componente Principal da Página ---
export default function SettingsPage() {
    const { sellers: contextSellers, goals: contextGoals, setSellers, setGoals, setIsDirty } = useAdminContext();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sellers: [],
            goals: contextGoals || {
                salesValue: { metinha: {threshold:0, prize:0}, meta: {threshold:0, prize:0}, metona: {threshold:0, prize:0}, lendaria: {threshold:0, prize:0} },
                ticketAverage: { metinha: {threshold:0, prize:0}, meta: {threshold:0, prize:0}, metona: {threshold:0, prize:0}, lendaria: {threshold:0, prize:0} },
                pa: { metinha: {threshold:0, prize:0}, meta: {threshold:0, prize:0}, metona: {threshold:0, prize:0}, lendaria: {threshold:0, prize:0} },
                points: { metinha: {threshold:0, prize:0}, meta: {threshold:0, prize:0}, metona: {threshold:0, prize:0}, lendaria: {threshold:0, prize:0} },
                gamification: { missions: true, academia: true, quiz: true, ofertas: true, loja: true, ranking: true }
            }
        },
    });

    const { fields } = useFieldArray({ control: form.control, name: "sellers" });

    useEffect(() => {
        if (contextSellers.length > 0 && contextGoals) {
            form.reset({
                sellers: contextSellers.map(s => ({
                    id: s.id,
                    name: s.name,
                    salesValue: s.salesValue || 0,
                    ticketAverage: s.ticketAverage || 0,
                    pa: s.pa || 0,
                    extraPoints: s.extraPoints || 0,
                })),
                goals: {
                    ...contextGoals,
                    gamification: contextGoals.gamification || { missions: true, academia: true, quiz: true, ofertas: true, loja: true, ranking: true }
                }
            });
        }
    }, [contextSellers, contextGoals, form]);

    useEffect(() => { setIsDirty(form.formState.isDirty); }, [form.formState.isDirty, setIsDirty]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            data.sellers.forEach(seller => {
                const sellerRef = doc(db, 'sellers', seller.id);
                batch.update(sellerRef, {
                    salesValue: seller.salesValue,
                    ticketAverage: seller.ticketAverage,
                    pa: seller.pa,
                    extraPoints: seller.extraPoints,
                });
            });
            const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
            batch.set(goalsRef, data.goals);
            await batch.commit();
            const updatedSellers = contextSellers.map(cs => ({ ...cs, ...data.sellers.find(ds => ds.id === cs.id) }));
            setSellers(() => updatedSellers);
            setGoals(() => data.goals);
            toast({ title: "Alterações Salvas!", description: "As suas configurações foram atualizadas com sucesso." });
            form.reset(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: "Ocorreu um erro ao tentar salvar as alterações." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEndCycle = async () => {
        if (form.formState.isDirty) {
            toast({ variant: "destructive", title: "Alterações Pendentes", description: "Salve as suas alterações antes de finalizar o ciclo."});
            return;
        }
        setIsSaving(true);
        try {
            const cycleData = { endDate: new Date(), sellers: contextSellers, goals: contextGoals };
            await addDoc(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/cycle_history`), cycleData);
            const batch = writeBatch(db);
            contextSellers.forEach(seller => {
                const sellerRef = doc(db, 'sellers', seller.id);
                batch.update(sellerRef, { salesValue: 0, ticketAverage: 0, pa: 0, points: 0, extraPoints: 0 });
            });
            await batch.commit();
            toast({ title: "Ciclo Finalizado com Sucesso!", description: "Os dados de performance foram zerados e o histórico foi salvo." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao Finalizar o Ciclo" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><Shield className="size-8 text-primary" /><h1 className="text-3xl font-bold">Configurações Gerais</h1></div>
                {form.formState.isDirty && (
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-semibold hidden sm:inline">Alterações não salvas</span>
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar Tudo
                        </Button>
                    </div>
                )}
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs defaultValue="lancamentos" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
                            <TabsTrigger value="metas">Metas e Prémios</TabsTrigger>
                            <TabsTrigger value="modulos">Módulos</TabsTrigger>
                            <TabsTrigger value="ciclo">Ciclo de Vendas</TabsTrigger>
                        </TabsList>
                        <TabsContent value="lancamentos" className="mt-6"><TabelaDePerformance control={form.control} fields={fields} /></TabsContent>
                        <TabsContent value="metas" className="mt-6"><FormularioDeMetas control={form.control} getValues={form.getValues} /></TabsContent>
                        <TabsContent value="modulos" className="mt-6"><GestaoDeModulos control={form.control} /></TabsContent>
                        <TabsContent value="ciclo" className="mt-6"><GestaoDeCiclo onEndCycle={handleEndCycle} isDirty={form.formState.isDirty} /></TabsContent>
                    </Tabs>
                </form>
            </Form>
        </div>
    );
}