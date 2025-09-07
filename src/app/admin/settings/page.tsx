/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw, AlertTriangle, Loader2, Save, Target, GraduationCap, ShoppingBag, Trophy, BarChart, Zap, Lightbulb, Users, Award, Group, CalendarDays } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from '@/contexts/AdminContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import type { Seller } from '@/lib/types';

// --- Esquemas de Validação com Zod ---
const optionalNumber = z.union([z.string(), z.number()]).optional().transform(v => v === '' ? undefined : Number(v) || undefined);

const goalLevelSchema = z.object({
  threshold: optionalNumber,
  prize: optionalNumber,
}).refine(data => (data.threshold != null && data.prize != null) || (data.threshold == null && data.prize == null), {
  message: "Preencha ambos os campos ou deixe-os em branco.",
  path: ["prize"],
});

const performanceBonusSchema = z.object({
    per: optionalNumber,
    prize: optionalNumber,
}).refine(data => (data.per != null && data.prize != null) || (data.per == null && data.prize == null), {
    message: "Preencha ambos os campos ou deixe-os em branco.",
    path: ["prize"],
});

const metricGoalsSchema = z.object({
    metinha: goalLevelSchema,
    meta: goalLevelSchema,
    metona: goalLevelSchema,
    lendaria: goalLevelSchema,
    performanceBonus: performanceBonusSchema.optional(),
    topScorerPrize: optionalNumber,
});

const sellerPerformanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  salesValue: z.coerce.number().min(0, "Deve ser positivo."),
  ticketAverage: z.coerce.number().min(0, "Deve ser positivo."),
  pa: z.coerce.number().min(0, "Deve ser positivo."),
  points: z.coerce.number().min(0, "Deve ser positivo."),
});

const gamificationSchema = z.object({
    missions: z.boolean().default(true),
    academia: z.boolean().default(true),
    quiz: z.boolean().default(true),
    ofertas: z.boolean().default(true),
    loja: z.boolean().default(true),
    ranking: z.boolean().default(true),
    sprints: z.boolean().default(true),
    escala: z.boolean().default(true),
});

const formSchema = z.object({
  sellers: z.array(sellerPerformanceSchema),
  goals: z.object({
    salesValue: metricGoalsSchema,
    ticketAverage: metricGoalsSchema,
    pa: metricGoalsSchema,
    points: metricGoalsSchema,
    gamification: gamificationSchema,
    teamGoalBonus: optionalNumber,
  }),
});

type FormData = z.infer<typeof formSchema>;
type GoalLevels = 'metinha' | 'meta' | 'metona' | 'lendaria';
type GoalMetric = Exclude<keyof FormData['goals'], 'gamification' | 'teamGoalBonus'>;

// --- Sub-componentes Refatorados ---

const TabelaDePerformance = ({ control, fields }: { control: Control<FormData>, fields: Seller[] }) => (
    <Card>
        <CardHeader><CardTitle>Lançamento de Performance</CardTitle><CardDescription>Insira os valores de vendas e outros indicadores para cada vendedor.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>Vendas (R$)</TableHead><TableHead>Ticket Médio (R$)</TableHead><TableHead>PA</TableHead><TableHead>Pontos (Performance)</TableHead></TableRow></TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.salesValue`} render={({ field: { onChange, ...rest } }) => <CurrencyInput onValueChange={onChange} {...rest} value={rest.value ?? ''} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.ticketAverage`} render={({ field: { onChange, ...rest } }) => <CurrencyInput onValueChange={onChange} {...rest} value={rest.value ?? ''} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.pa`} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} />} /></TableCell>
                            <TableCell><FormField control={control} name={`sellers.${index}.points`} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} />} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const FormularioDeMetas = ({ control }: { control: Control<FormData> }) => {
    const goalMetrics: GoalMetric[] = ['salesValue', 'ticketAverage', 'pa', 'points'];
    const goalLevels: GoalLevels[] = ['metinha', 'meta', 'metona', 'lendaria'];
    const getMetricLabel = (metric: string) => ({ salesValue: 'Vendas', ticketAverage: 'Ticket Médio', pa: 'PA (Peças por Atendimento)', points: 'Pontos' }[metric] || metric);
    
    return (
        <Card>
            <CardHeader><CardTitle>Metas de Performance e Prémios</CardTitle><CardDescription>Defina os objetivos para cada indicador e o prémio correspondente.</CardDescription></CardHeader>
            <CardContent className="space-y-6 pt-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Group/> Meta Global de Equipa</CardTitle></CardHeader>
                    <CardContent>
                        <FormField control={control} name="goals.teamGoalBonus" render={({ field: { onChange, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Bónus de Equipa</FormLabel>
                                <FormDescription>Prémio que cada vendedor ganha se TODOS atingirem a &quot;Metinha&quot; de Vendas.</FormDescription>
                                <FormControl><CurrencyInput onValueChange={onChange} {...rest} /></FormControl>
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                {goalMetrics.map((metric) => (
                    <div key={metric} className="space-y-3 pt-4 border-t first:border-t-0 first:pt-0">
                        <h3 className="text-lg font-semibold">{getMetricLabel(metric)}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {goalLevels.map(level => (
                                <Card key={level} className="p-4"><h4 className="font-medium capitalize mb-2">{level}</h4><div className="space-y-2">
                                    <FormField control={control} name={`goals.${metric}.${level}.threshold`} render={({ field: { onChange, ...rest } }) => (<FormItem><FormLabel>Meta</FormLabel><FormControl>{metric === 'salesValue' || metric === 'ticketAverage' ? <CurrencyInput onValueChange={onChange} {...rest}/> : <Input type="number" {...rest} value={rest.value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)} />}</FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`goals.${metric}.${level}.prize`} render={({ field: { onChange, ...rest } }) => (<FormItem><FormLabel>Prémio (R$)</FormLabel><FormControl><CurrencyInput onValueChange={onChange} {...rest} /></FormControl><FormMessage /></FormItem>)} />
                                </div></Card>
                            ))}
                        </div>

                         <div className="pt-4 mt-4 border-t">
                            <h4 className="text-md font-semibold mb-2">Prémios de Performance Individual</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <FormField control={control} name={`goals.${metric}.performanceBonus.prize`} render={({ field: { onChange, ...rest } }) => (<FormItem><FormLabel className="flex items-center gap-2"><Users className="size-4"/> Bónus de Performance (Prémio)</FormLabel><FormControl><CurrencyInput onValueChange={onChange} {...rest} /></FormControl></FormItem>)} />
                                    <FormField control={control} name={`goals.${metric}.performanceBonus.per`} render={({ field: { onChange, ...rest } }) => (<FormItem className="mt-2"><FormLabel className="text-xs">A cada (unidade)</FormLabel><FormControl>{metric === 'salesValue' || metric === 'ticketAverage' ? <CurrencyInput onValueChange={onChange} {...rest}/> : <Input type="number" {...rest} value={rest.value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)} />}</FormControl></FormItem>)} />
                                </Card>
                                <Card className="p-4">
                                    <FormField control={control} name={`goals.${metric}.topScorerPrize`} render={({ field: { onChange, ...rest } }) => (<FormItem><FormLabel className="flex items-center gap-2"><Award className="size-4"/> Prémio Melhor Vendedor</FormLabel><FormControl><CurrencyInput onValueChange={onChange} {...rest} /></FormControl></FormItem>)} />
                                </Card>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const GestaoDeModulos = ({ control }: { control: Control<FormData> }) => {
    const modulos: { name: keyof z.infer<typeof gamificationSchema>, label: string, icon: React.ElementType }[] = [
        { name: 'missions', label: 'Missões', icon: Target }, { name: 'sprints', label: 'Corridinha Diária', icon: Zap }, { name: 'academia', label: 'Academia', icon: GraduationCap },
        { name: 'quiz', label: 'Quiz', icon: Lightbulb }, { name: 'ofertas', label: 'Ofertas', icon: ShoppingBag }, { name: 'loja', label: 'Loja de Prémios', icon: Trophy }, { name: 'ranking', label: 'Meu Desempenho', icon: BarChart },
        { name: 'escala', label: 'Escala de Trabalho', icon: CalendarDays },
    ];
    return (
        <Card>
            <CardHeader><CardTitle>Gestão de Módulos</CardTitle><CardDescription>Ative ou desative os módulos que aparecem para os vendedores.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                {modulos.map(({ name, label, icon: Icon }) => (
                    <FormField key={name} control={control} name={`goals.gamification.${name}`} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><FormLabel className="text-base flex items-center gap-2"><Icon className="size-5" />{label}</FormLabel><FormDescription>{field.value ? 'Visível' : 'Oculto'}</FormDescription></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                ))}
            </CardContent>
        </Card>
    );
};

const GestaoDeCiclo = ({ onEndCycle, isDirty }: { onEndCycle: () => void; isDirty: boolean; }) => (
    <Card>
        <CardHeader><CardTitle>Gestão de Ciclo</CardTitle><CardDescription>Finalize o ciclo atual para arquivar os resultados e começar um novo.</CardDescription></CardHeader>
        <CardContent>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-4"><AlertTriangle className="size-6 text-destructive mt-1" />
                    <div>
                        <h4 className="font-semibold text-destructive">Ação Irreversível</h4>
                        <p className="text-sm text-destructive/80 mt-1">Ao finalizar, os dados de performance de todos os vendedores serão zerados. O estado atual será salvo no histórico.</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4" disabled={isDirty}><RefreshCw className="mr-2" />Finalizar Ciclo</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onEndCycle}>Sim, finalizar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        {isDirty && <p className="text-xs text-destructive/80 mt-2">Salve as alterações pendentes para poder finalizar o ciclo.</p>}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- Componente Principal da Página ---
export default function SettingsPage() {
    const { sellers: contextSellers, goals: contextGoals, isLoading, updateSettings, setIsDirty } = useAdminContext();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { sellers: [], goals: contextGoals?.data as any || {} },
    });

    const { control, handleSubmit, reset, formState: { isDirty } } = form;
    
    useEffect(() => {
      if (setIsDirty) {
        setIsDirty(isDirty);
      }
    }, [isDirty, setIsDirty]);

    useEffect(() => {
        const sellersData = contextSellers.map(s => ({
            id: s.id, name: s.name, salesValue: s.sales_value || 0,
            ticketAverage: s.ticket_average || 0, pa: s.pa || 0, points: s.points || 0,
        }));
        
        const goalsData = contextGoals?.data || {};

        reset({ sellers: sellersData, goals: goalsData as any });
        
    }, [contextSellers, contextGoals, reset]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (!updateSettings) {
                throw new Error("A função para atualizar as configurações não está disponível.");
            }
            await updateSettings(data);
            reset(data);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleEndCycle = useCallback(async () => {
        toast({ title: "Funcionalidade Pendente", description: "A finalização de ciclo será implementada na nova arquitetura." });
    }, [toast]);

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><Shield className="size-8 text-primary" /><h1 className="text-3xl font-bold">Configurações Gerais</h1></div>
                {isDirty && (
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-semibold hidden sm:inline">Alterações não salvas</span>
                        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Tudo
                        </Button>
                    </div>
                )}
            </div>
            <Form {...form}>
                <form>
                    <Tabs defaultValue="lancamentos" className="w-full">
                        <TabsList>
                            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
                            <TabsTrigger value="metas">Metas e Prémios</TabsTrigger>
                            <TabsTrigger value="modulos">Módulos</TabsTrigger>
                            <TabsTrigger value="ciclo">Ciclo de Vendas</TabsTrigger>
                        </TabsList>
                        {/* **INÍCIO DA CORREÇÃO** */}
                        <TabsContent value="lancamentos" className="mt-6"><TabelaDePerformance control={control} fields={contextSellers} /></TabsContent>
                        <TabsContent value="metas" className="mt-6"><FormularioDeMetas control={control} /></TabsContent>
                        <TabsContent value="modulos" className="mt-6"><GestaoDeModulos control={control} /></TabsContent>
                        <TabsContent value="ciclo" className="mt-6"><GestaoDeCiclo onEndCycle={handleEndCycle} isDirty={isDirty} /></TabsContent>
                        {/* **FIM DA CORREÇÃO** */}
                    </Tabs>
                </form>
            </Form>
        </div>
    );
}