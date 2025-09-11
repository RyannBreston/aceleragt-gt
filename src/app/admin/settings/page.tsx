// src/app/admin/settings/page.tsx

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
import { Shield, RefreshCw, AlertTriangle, Loader2, Target, GraduationCap, ShoppingBag, Trophy, BarChart, Zap, Lightbulb, Users, Award, Group, CalendarDays } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from '@/contexts/AdminContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import type { Seller } from '@/lib/types';
import SaveAllButton from '@/components/SaveAllButton';

// --- Esquemas de Validação com Zod ---
const optionalNumber = z.union([z.string(), z.number()]).optional().transform(v => {
  if (v === '' || v === null || v === undefined) return undefined;
  const num = Number(v);
  return isNaN(num) ? undefined : num;
});

const goalLevelSchema = z.object({
  threshold: optionalNumber,
  prize: optionalNumber,
}).refine(data => {
  const hasThreshold = data.threshold != null;
  const hasPrize = data.prize != null;
  return (hasThreshold && hasPrize) || (!hasThreshold && !hasPrize);
}, {
  message: "Preencha ambos os campos ou deixe-os em branco.",
  path: ["prize"],
});

const performanceBonusSchema = z.object({
    per: optionalNumber,
    prize: optionalNumber,
}).refine(data => {
    const hasPer = data.per != null;
    const hasPrize = data.prize != null;
    return (hasPer && hasPrize) || (!hasPer && !hasPrize);
}, {
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
  sales_value: z.coerce.number().min(0, "Deve ser positivo."),
  ticket_average: z.coerce.number().min(0, "Deve ser positivo."),
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
    salesValue: metricGoalsSchema.optional(),
    ticketAverage: metricGoalsSchema.optional(),
    pa: metricGoalsSchema.optional(),
    points: metricGoalsSchema.optional(),
    gamification: gamificationSchema,
    teamGoalBonus: optionalNumber,
  }),
});

type FormData = z.infer<typeof formSchema>;
type GoalLevels = 'metinha' | 'meta' | 'metona' | 'lendaria';
type GoalMetric = Exclude<keyof FormData['goals'], 'gamification' | 'teamGoalBonus'>;

// --- Sub-componentes Refatorados ---

const TabelaDePerformance = ({ control, fields }: { control: Control<FormData>, fields: Seller[] }) => (
    <Card className="shadow-md rounded-lg">
        <CardHeader>
            <CardTitle>Lançamento de Performance</CardTitle>
            <CardDescription>Insira os valores de vendas e outros indicadores para cada vendedor.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-muted">
                <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                        <TableHead className="px-4 py-2">Vendedor</TableHead>
                        <TableHead className="px-4 py-2">Vendas (R$)</TableHead>
                        <TableHead className="px-4 py-2">Ticket Médio (R$)</TableHead>
                        <TableHead className="px-4 py-2">PA</TableHead>
                        <TableHead className="px-4 py-2">Pontos (Performance)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(fields || []).map((field, index) => (
                        <TableRow key={field.id} className="even:bg-muted/10 hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell>
                                <FormField 
                                    control={control} 
                                    name={`sellers.${index}.sales_value`} 
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <CurrencyInput 
                                                    onValueChange={onChange} 
                                                    {...rest} 
                                                    value={value?.toString() ?? ''} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </TableCell>
                            <TableCell>
                                <FormField 
                                    control={control} 
                                    name={`sellers.${index}.ticket_average`} 
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <CurrencyInput 
                                                    onValueChange={onChange} 
                                                    {...rest} 
                                                    value={value?.toString() ?? ''} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </TableCell>
                            <TableCell>
                                <FormField 
                                    control={control} 
                                    name={`sellers.${index}.pa`} 
                                    render={({ field: { value, onChange, ...rest } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    {...rest} 
                                                    value={value?.toString() ?? ''} 
                                                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </TableCell>
                            <TableCell>
                                <FormField 
                                    control={control} 
                                    name={`sellers.${index}.points`} 
                                    render={({ field: { value, onChange, ...rest } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    {...rest} 
                                                    value={value?.toString() ?? ''} 
                                                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </TableCell>
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
    const getMetricLabel = (metric: string) => ({ 
        salesValue: 'Vendas', 
        ticketAverage: 'Ticket Médio', 
        pa: 'PA (Peças por Atendimento)', 
        points: 'Pontos' 
    }[metric] || metric);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Metas de Performance e Prémios</CardTitle>
                <CardDescription>Defina os objetivos para cada indicador e o prémio correspondente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Group/> Meta Global de Equipa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField 
                            control={control} 
                            name="goals.teamGoalBonus" 
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>Bónus de Equipa</FormLabel>
                                    <FormDescription>
                                        Prémio que cada vendedor ganha se TODOS atingirem a &quot;Metinha&quot; de Vendas.
                                    </FormDescription>
                                    <FormControl>
                                        <CurrencyInput 
                                            onValueChange={onChange} 
                                            {...rest} 
                                            value={value?.toString() ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} 
                        />
                    </CardContent>
                </Card>

                {goalMetrics.map((metric) => (
                    <div key={metric} className="space-y-3 pt-4 border-t first:border-t-0 first:pt-0">
                        <h3 className="text-lg font-semibold">{getMetricLabel(metric)}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {goalLevels.map(level => (
                                <Card key={level} className="p-4">
                                    <h4 className="font-medium capitalize mb-2">{level}</h4>
                                    <div className="space-y-2">
                                        <FormField 
                                            control={control} 
                                            name={`goals.${metric}.${level}.threshold`} 
                                            render={({ field: { onChange, value, ...rest } }) => (
                                                <FormItem>
                                                    <FormLabel>Meta</FormLabel>
                                                    <FormControl>
                                                        {metric === 'salesValue' || metric === 'ticketAverage' ? (
                                                            <CurrencyInput 
                                                                onValueChange={onChange} 
                                                                {...rest}
                                                                value={value?.toString() ?? ''}
                                                            />
                                                        ) : (
                                                            <Input 
                                                                type="number" 
                                                                {...rest} 
                                                                value={value?.toString() ?? ''} 
                                                                onChange={e => onChange(parseFloat(e.target.value) || undefined)} 
                                                            />
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} 
                                        />
                                        <FormField 
                                            control={control} 
                                            name={`goals.${metric}.${level}.prize`} 
                                            render={({ field: { onChange, value, ...rest } }) => (
                                                <FormItem>
                                                    <FormLabel>Prémio (R$)</FormLabel>
                                                    <FormControl>
                                                        <CurrencyInput 
                                                            onValueChange={onChange} 
                                                            {...rest} 
                                                            value={value?.toString() ?? ''}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} 
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="pt-4 mt-4 border-t">
                            <h4 className="text-md font-semibold mb-2">Prémios de Performance Individual</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <FormField 
                                        control={control} 
                                        name={`goals.${metric}.performanceBonus.prize`} 
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Users className="size-4"/> Bónus de Performance (Prémio)
                                                </FormLabel>
                                                <FormControl>
                                                    <CurrencyInput 
                                                        onValueChange={onChange} 
                                                        {...rest} 
                                                        value={value?.toString() ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                    <FormField 
                                        control={control} 
                                        name={`goals.${metric}.performanceBonus.per`} 
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <FormItem className="mt-2">
                                                <FormLabel className="text-xs">A cada (unidade)</FormLabel>
                                                <FormControl>
                                                    {metric === 'salesValue' || metric === 'ticketAverage' ? (
                                                        <CurrencyInput 
                                                            onValueChange={onChange} 
                                                            {...rest}
                                                            value={value?.toString() ?? ''}
                                                        />
                                                    ) : (
                                                        <Input 
                                                            type="number" 
                                                            {...rest} 
                                                            value={value?.toString() ?? ''} 
                                                            onChange={e => onChange(parseFloat(e.target.value) || undefined)} 
                                                        />
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                </Card>
                                <Card className="p-4">
                                    <FormField 
                                        control={control} 
                                        name={`goals.${metric}.topScorerPrize`} 
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Award className="size-4"/> Prémio Melhor Vendedor
                                                </FormLabel>
                                                <FormControl>
                                                    <CurrencyInput 
                                                        onValueChange={onChange} 
                                                        {...rest} 
                                                        value={value?.toString() ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
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
        { name: 'missions', label: 'Missões', icon: Target }, 
        { name: 'sprints', label: 'Corridinha Diária', icon: Zap }, 
        { name: 'academia', label: 'Academia', icon: GraduationCap },
        { name: 'quiz', label: 'Quiz', icon: Lightbulb }, 
        { name: 'ofertas', label: 'Ofertas', icon: ShoppingBag }, 
        { name: 'loja', label: 'Loja de Prémios', icon: Trophy }, 
        { name: 'ranking', label: 'Meu Desempenho', icon: BarChart },
        { name: 'escala', label: 'Escala de Trabalho', icon: CalendarDays },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestão de Módulos</CardTitle>
                <CardDescription>Ative ou desative os módulos que aparecem para os vendedores.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                {modulos.map(({ name, label, icon: Icon }) => (
                    <FormField 
                        key={name} 
                        control={control} 
                        name={`goals.gamification.${name}`} 
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center gap-2">
                                        <Icon className="size-5" />{label}
                                    </FormLabel>
                                    <FormDescription>
                                        {field.value ? 'Visível' : 'Oculto'}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch 
                                        checked={field.value ?? true} 
                                        onCheckedChange={field.onChange} 
                                    />
                                </FormControl>
                            </FormItem>
                        )} 
                    />
                ))}
            </CardContent>
        </Card>
    );
};

const GestaoDeCiclo = ({ onEndCycle, isDirty }: { onEndCycle: () => void; isDirty: boolean; }) => (
    <Card>
        <CardHeader>
            <CardTitle>Gestão de Ciclo</CardTitle>
            <CardDescription>Finalize o ciclo atual para arquivar os resultados e começar um novo.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="size-6 text-destructive mt-1" />
                    <div>
                        <h4 className="font-semibold text-destructive">Ação Irreversível</h4>
                        <p className="text-sm text-destructive/80 mt-1">
                            Ao finalizar, os dados de performance de todos os vendedores serão zerados. O estado atual será salvo no histórico.
                        </p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="mt-4" disabled={isDirty}>
                                    <RefreshCw className="mr-2" />Finalizar Ciclo
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={onEndCycle}>Sim, finalizar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        {isDirty && (
                            <p className="text-xs text-destructive/80 mt-2">
                                Salve as alterações pendentes para poder finalizar o ciclo.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- Componente Principal da Página ---
export default function SettingsPage() {
    const { sellers: contextSellers, goals: contextGoals, isLoading, updateSettings } = useAdminContext();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { 
            sellers: [], 
            goals: {
                salesValue: {
                    metinha: { threshold: undefined, prize: undefined },
                    meta: { threshold: undefined, prize: undefined },
                    metona: { threshold: undefined, prize: undefined },
                    lendaria: { threshold: undefined, prize: undefined },
                    performanceBonus: { per: undefined, prize: undefined },
                    topScorerPrize: undefined,
                },
                ticketAverage: {
                    metinha: { threshold: undefined, prize: undefined },
                    meta: { threshold: undefined, prize: undefined },
                    metona: { threshold: undefined, prize: undefined },
                    lendaria: { threshold: undefined, prize: undefined },
                    performanceBonus: { per: undefined, prize: undefined },
                    topScorerPrize: undefined,
                },
                pa: {
                    metinha: { threshold: undefined, prize: undefined },
                    meta: { threshold: undefined, prize: undefined },
                    metona: { threshold: undefined, prize: undefined },
                    lendaria: { threshold: undefined, prize: undefined },
                    performanceBonus: { per: undefined, prize: undefined },
                    topScorerPrize: undefined,
                },
                points: {
                    metinha: { threshold: undefined, prize: undefined },
                    meta: { threshold: undefined, prize: undefined },
                    metona: { threshold: undefined, prize: undefined },
                    lendaria: { threshold: undefined, prize: undefined },
                    performanceBonus: { per: undefined, prize: undefined },
                    topScorerPrize: undefined,
                },
                gamification: {
                    missions: true,
                    academia: true,
                    quiz: true,
                    ofertas: true,
                    loja: true,
                    ranking: true,
                    sprints: true,
                    escala: true,
                },
                teamGoalBonus: undefined,
            }
        },
    });

    const { control, handleSubmit, reset, formState: { isDirty } } = form;

    useEffect(() => {
        if (contextSellers && contextGoals) {
            const sellersData = (contextSellers || []).map(s => ({
                id: s.id, 
                name: s.name, 
                sales_value: s.sales_value || 0,
                ticket_average: s.ticket_average || 0, 
                pa: s.pa || 0, 
                points: s.points || 0,
            }));
            
            const goalsData = contextGoals?.data || {};
            const formData: FormData = {
                sellers: sellersData,
                goals: {
                    ...goalsData,
                    gamification: {
                        missions: true,
                        academia: true,
                        quiz: true,
                        ofertas: true,
                        loja: true,
                        ranking: true,
                        sprints: true,
                        escala: true,
                        ...((goalsData as { gamification?: any })?.gamification ? (goalsData as { gamification?: any }).gamification : {}),
                    }
                }
            };
            reset(formData);
        }
    }, [contextSellers, contextGoals, reset]);

    const onSubmit = useCallback(async (data: FormData) => {
        console.log('Dados do formulário:', data); // Debug
        setIsSubmitting(true);
        try {
            // Map sellers to include missing properties from contextSellers
            const sellersWithFullProps = data.sellers.map(seller => {
                const contextSeller = contextSellers?.find(cs => cs.id === seller.id);
                let role: "admin" | "seller" = "seller";
                if (contextSeller?.role === "admin") role = "admin";
                else if (contextSeller?.role === "seller") role = "seller";
                return {
                    ...seller,
                    email: contextSeller?.email ?? "",
                    role
                };
            });
            await updateSettings({
                ...data,
                sellers: sellersWithFullProps,
                goals: {
                    salesValue: data.goals.salesValue ?? {
                        metinha: { threshold: undefined, prize: undefined },
                        meta: { threshold: undefined, prize: undefined },
                        metona: { threshold: undefined, prize: undefined },
                        lendaria: { threshold: undefined, prize: undefined },
                        performanceBonus: { per: undefined, prize: undefined },
                        topScorerPrize: undefined,
                    },
                    ticketAverage: data.goals.ticketAverage ?? {
                        metinha: { threshold: undefined, prize: undefined },
                        meta: { threshold: undefined, prize: undefined },
                        metona: { threshold: undefined, prize: undefined },
                        lendaria: { threshold: undefined, prize: undefined },
                        performanceBonus: { per: undefined, prize: undefined },
                        topScorerPrize: undefined,
                    },
                    pa: data.goals.pa ?? {
                        metinha: { threshold: undefined, prize: undefined },
                        meta: { threshold: undefined, prize: undefined },
                        metona: { threshold: undefined, prize: undefined },
                        lendaria: { threshold: undefined, prize: undefined },
                        performanceBonus: { per: undefined, prize: undefined },
                        topScorerPrize: undefined,
                    },
                    points: data.goals.points ?? {
                        metinha: { threshold: undefined, prize: undefined },
                        meta: { threshold: undefined, prize: undefined },
                        metona: { threshold: undefined, prize: undefined },
                        lendaria: { threshold: undefined, prize: undefined },
                        performanceBonus: { per: undefined, prize: undefined },
                        topScorerPrize: undefined,
                    },
                    gamification: data.goals.gamification,
                    teamGoalBonus: data.goals.teamGoalBonus,
                }
            });
            reset({
                ...data,
                sellers: sellersWithFullProps
            }); // Reseta o formulário com os novos dados salvos, definindo isDirty para false
            toast({
                title: "Sucesso!",
                description: "Configurações salvas com sucesso."
            });
        } catch (error: any) {
            console.error('Erro ao salvar:', error); // Debug
            toast({ 
                variant: "destructive", 
                title: "Erro ao Salvar", 
                description: error.message || "Ocorreu um erro inesperado." 
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [updateSettings, toast, contextSellers]);
    
    const handleEndCycle = useCallback(async () => {
        toast({ 
            title: "Funcionalidade Pendente", 
            description: "A finalização de ciclo será implementada em breve." 
        });
    }, [toast]);

    const onSaveAll = useCallback(async () => {
        await handleSubmit(onSubmit)();
    }, [handleSubmit, onSubmit]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Shield className="size-8 text-primary" />
                            <h1 className="text-3xl font-bold">Configurações Gerais</h1>
                        </div>
                        {isDirty && (
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-400 font-semibold hidden sm:inline">
                                    Alterações não salvas
                                </span>
                                <SaveAllButton onSave={onSaveAll} disabled={!isDirty || isSubmitting} />
                            </div>
                        )}
                    </div>
                    <Tabs defaultValue="lancamentos" className="w-full">
                        <TabsList>
                            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
                            <TabsTrigger value="metas">Metas e Prémios</TabsTrigger>
                            <TabsTrigger value="modulos">Módulos</TabsTrigger>
                            <TabsTrigger value="ciclo">Ciclo de Vendas</TabsTrigger>
                        </TabsList>
                        <TabsContent value="lancamentos" className="mt-6">
                            <TabelaDePerformance control={control} fields={contextSellers || []} />
                        </TabsContent>
                        <TabsContent value="metas" className="mt-6">
                            <FormularioDeMetas control={control} />
                        </TabsContent>
                        <TabsContent value="modulos" className="mt-6">
                            <GestaoDeModulos control={control} />
                        </TabsContent>
                        <TabsContent value="ciclo" className="mt-6">
                            <GestaoDeCiclo onEndCycle={handleEndCycle} isDirty={isDirty} />
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
        </div>
    );
}