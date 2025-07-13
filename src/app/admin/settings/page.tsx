'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Flag, Shield, Info, ClipboardList, Trophy, RefreshCw, AlertTriangle, History, Loader2, Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContext } from '@/app/admin/layout';
import type { Seller, Goals, GoalLevels, GamificationPoints, PointsGoals, SalesValueGoals } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const goalLevels: Array<{key: keyof GoalLevels, label: string}> = [
    { key: 'metinha', label: 'Metinha'}, { key: 'meta', label: 'Meta'},
    { key: 'metona', label: 'Metona'}, { key: 'lendaria', label: 'Lendária'},
];

const gamificationLevels: Array<{key: keyof GamificationPoints['course'], label: string}> = [
    { key: 'Fácil', label: 'Fácil'}, { key: 'Médio', label: 'Médio'}, { key: 'Difícil', label: 'Difícil'},
];


export default function SettingsPage() {
  const { sellers, setSellers, goals, setGoals, setCycleHistory, isDirty, setIsDirty } = useAdminContext();
  const { toast } = useToast();
  
  const [localSellers, setLocalSellers] = useState<Seller[]>([]);
  const [localGoals, setLocalGoals] = useState<Goals>(goals);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setLocalSellers(JSON.parse(JSON.stringify(sellers)));
  }, [sellers]);

  useEffect(() => {
    setLocalGoals(JSON.parse(JSON.stringify(goals)));
  }, [goals]);

  useEffect(() => {
    const hasUnsavedChanges = JSON.stringify(localSellers) !== JSON.stringify(sellers) || JSON.stringify(localGoals) !== JSON.stringify(goals);
    if (hasUnsavedChanges !== isDirty) {
        setIsDirty(hasUnsavedChanges);
    }
  }, [localSellers, localGoals, sellers, goals, isDirty, setIsDirty]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);


  const handleGoalChange = (
    criterion: keyof Omit<Goals, 'gamification'>,
    level: keyof GoalLevels,
    field: 'threshold' | 'prize',
    value: string
  ) => {
    setLocalGoals(prev => {
        const updatedGoals = JSON.parse(JSON.stringify(prev));
        if (criterion in updatedGoals) {
             updatedGoals[criterion][level][field] = parseFloat(value) || 0;
        }
        return updatedGoals;
    });
  };
  
  const handlePointsPropertyChange = (
    field: keyof Omit<PointsGoals, keyof GoalLevels>,
    value: string
  ) => {
    setLocalGoals(prev => {
      const updatedGoals = JSON.parse(JSON.stringify(prev));
      updatedGoals.points[field] = parseFloat(value) || 0;
      return updatedGoals;
    });
  };

  const handleGamificationChange = (
    type: 'course' | 'quiz',
    level: 'Fácil' | 'Médio' | 'Difícil',
    value: string
  ) => {
     setLocalGoals(prev => {
        const updatedGoals = JSON.parse(JSON.stringify(prev));
        updatedGoals.gamification[type][level] = parseFloat(value) || 0;
        return updatedGoals;
    });
  }

  const handlePerformanceBonusChange = (
    field: 'per' | 'prize',
    value: string
  ) => {
    setLocalGoals(prev => {
      const updatedGoals = JSON.parse(JSON.stringify(prev));
      const bonus = updatedGoals.salesValue.performanceBonus ?? { per: 0, prize: 0 };
      bonus[field] = parseFloat(value) || 0;
      updatedGoals.salesValue.performanceBonus = bonus;
      return updatedGoals;
    });
  };

  const handleSellerPerfUpdate = (id: string, field: keyof Omit<Seller, 'id' | 'name' | 'nickname' | 'password' | 'email' | 'role'>, value: string) => {
    setLocalSellers(prevSellers =>
      prevSellers.map(seller => {
        if (seller.id !== id) return seller;
        return { ...seller, [field]: parseFloat(value) || 0 };
      })
    );
  };
  
  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    try {
        const sellerPromises = localSellers.map(seller => {
            const sellerRef = doc(db, 'sellers', seller.id);
            return setDoc(sellerRef, seller, { merge: true });
        });

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const goalsDocPath = `artifacts/${appId}/public/data/goals`;
        const goalsRef = doc(db, goalsDocPath, 'main');
        const goalsPromise = setDoc(goalsRef, localGoals);

        await Promise.all([...sellerPromises, goalsPromise]);

        setSellers(() => localSellers);
        setGoals(() => localGoals);
        setIsDirty(false);

        toast({
            title: "Alterações Salvas!",
            description: "Todas as suas configurações foram atualizadas com sucesso no banco de dados.",
        });
    } catch (error) {
        console.error("Erro ao salvar alterações:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar as alterações. Verifique o console para mais detalhes.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleEndCycle = () => {
    const snapshot = {
        id: new Date().toISOString(),
        endDate: new Date().toISOString(),
        sellers: JSON.parse(JSON.stringify(sellers)),
        goals: JSON.parse(JSON.stringify(goals)),
    };

    setCycleHistory(prev => [...prev, snapshot]);

    const resetSellers = sellers.map(seller => ({
        ...seller,
        salesValue: 0,
        ticketAverage: 0,
        pa: 0,
        points: 0,
        extraPoints: 0,
        hasCompletedQuiz: false,
        lastCourseCompletionDate: undefined,
        completedCourseIds: [],
    }));

    const promises = resetSellers.map(s => updateDoc(doc(db, 'sellers', s.id), s));
    Promise.all(promises).then(() => {
        setSellers(() => resetSellers);
        toast({
            title: "Ciclo Finalizado!",
            description: "Os dados de performance foram zerados e um novo ciclo foi iniciado.",
        });
    }).catch(err => {
        console.error("Erro ao zerar ciclo:", err);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível finalizar o ciclo." });
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Shield className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">Configurações Gerais</h1>
        </div>
      </div>

      <Tabs defaultValue="lancamentos" className="w-full">
        <div className="flex items-center gap-4">
          <TabsList className="bg-card p-1 h-auto grid grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="ciclo">Ciclo</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="lancamentos" className="space-y-6 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Lançamento de Vendas</CardTitle>
              <CardDescription>Insira aqui os totais acumulados de vendas e outros indicadores de performance para cada vendedor.</CardDescription>
            </CardHeader>
            <CardContent>
                 {localSellers.length > 0 ? (
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendedor</TableHead>
                          <TableHead className="text-right">Valor de Venda (R$)</TableHead>
                          <TableHead className="text-right">Ticket Médio (R$)</TableHead>
                          <TableHead className="text-right">PA</TableHead>
                          <TableHead className="text-right">Pontos (Auto)</TableHead>
                          <TableHead className="text-right">Pontos Extras</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {localSellers.map((seller) => (
                          <TableRow key={seller.id}>
                            <TableCell className="font-medium whitespace-nowrap">{seller.name}</TableCell>
                            <TableCell>
                                <Input type="number" step="0.01" className="bg-input text-right min-w-[140px]" value={seller.salesValue} onChange={(e) => handleSellerPerfUpdate(seller.id, 'salesValue', e.target.value)} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" step="0.01" className="bg-input text-right min-w-[140px]" value={seller.ticketAverage} onChange={(e) => handleSellerPerfUpdate(seller.id, 'ticketAverage', e.target.value)} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" step="0.1" className="bg-input text-right min-w-[100px]" value={seller.pa} onChange={(e) => handleSellerPerfUpdate(seller.id, 'pa', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Input type="number" className="bg-input text-right min-w-[100px]" value={seller.points} disabled />
                                <TooltipProvider><Tooltip><TooltipTrigger><Info className="size-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Pontos de missões, cursos e quizzes. Modifique com cuidado.</p></TooltipContent></Tooltip></TooltipProvider>
                              </div>
                            </TableCell>
                             <TableCell>
                                <Input type="number" className="bg-input text-right min-w-[100px]" value={seller.extraPoints} onChange={(e) => handleSellerPerfUpdate(seller.id, 'extraPoints', e.target.value)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Nenhum vendedor encontrado</p>
                    <p className="text-sm">Vá para a página "Gerir Vendedores" para adicionar um novo vendedor.</p>
                  </div>
                )}
                 <div className="flex justify-end pt-6">
                    <Button onClick={handleSaveAllChanges} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Lançamentos
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metas" className="space-y-6 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Definir Metas de Performance</CardTitle>
              <CardDescription>Configure os valores para cada nível de meta e os prémios associados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Metas de Valor de Venda */}
              <div>
                <h3 className="text-lg font-medium mb-4">Valor de Venda (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalLevels.map(level => (
                    <div key={level.key} className="space-y-2 rounded-lg border p-3">
                      <h4 className="font-semibold text-center">{level.label}</h4>
                      <div className="space-y-1.5">
                        <Label htmlFor={`sales-${level.key}-threshold`}>Meta</Label>
                        <Input id={`sales-${level.key}-threshold`} type="number" placeholder="Valor" value={localGoals.salesValue[level.key].threshold} onChange={(e) => handleGoalChange('salesValue', level.key, 'threshold', e.target.value)} className="bg-input" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`sales-${level.key}-prize`}>Prémio (R$)</Label>
                        <Input id={`sales-${level.key}-prize`} type="number" placeholder="Prémio" value={localGoals.salesValue[level.key].prize} onChange={(e) => handleGoalChange('salesValue', level.key, 'prize', e.target.value)} className="bg-input" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metas de Ticket Médio */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-medium mb-4">Ticket Médio (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalLevels.map(level => (
                     <div key={level.key} className="space-y-2 rounded-lg border p-3">
                     <h4 className="font-semibold text-center">{level.label}</h4>
                     <div className="space-y-1.5">
                       <Label htmlFor={`ticket-${level.key}-threshold`}>Meta</Label>
                       <Input id={`ticket-${level.key}-threshold`} type="number" placeholder="Valor" value={localGoals.ticketAverage[level.key].threshold} onChange={(e) => handleGoalChange('ticketAverage', level.key, 'threshold', e.target.value)} className="bg-input" />
                     </div>
                     <div className="space-y-1.5">
                       <Label htmlFor={`ticket-${level.key}-prize`}>Prémio (R$)</Label>
                       <Input id={`ticket-${level.key}-prize`} type="number" placeholder="Prémio" value={localGoals.ticketAverage[level.key].prize} onChange={(e) => handleGoalChange('ticketAverage', level.key, 'prize', e.target.value)} className="bg-input" />
                     </div>
                   </div>
                  ))}
                </div>
              </div>

              {/* Metas de PA */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-medium mb-4">PA (Produtos por Atendimento)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalLevels.map(level => (
                    <div key={level.key} className="space-y-2 rounded-lg border p-3">
                      <h4 className="font-semibold text-center">{level.label}</h4>
                      <div className="space-y-1.5">
                        <Label htmlFor={`pa-${level.key}-threshold`}>Meta</Label>
                        <Input id={`pa-${level.key}-threshold`} type="number" step="0.1" placeholder="Valor" value={localGoals.pa[level.key].threshold} onChange={(e) => handleGoalChange('pa', level.key, 'threshold', e.target.value)} className="bg-input" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`pa-${level.key}-prize`}>Prémio (R$)</Label>
                        <Input id={`pa-${level.key}-prize`} type="number" placeholder="Prémio" value={localGoals.pa[level.key].prize} onChange={(e) => handleGoalChange('pa', level.key, 'prize', e.target.value)} className="bg-input" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metas de Pontos */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-medium mb-4">Pontos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalLevels.map(level => (
                    <div key={level.key} className="space-y-2 rounded-lg border p-3">
                      <h4 className="font-semibold text-center">{level.label}</h4>
                      <div className="space-y-1.5">
                        <Label htmlFor={`points-${level.key}-threshold`}>Meta</Label>
                        <Input id={`points-${level.key}-threshold`} type="number" placeholder="Valor" value={localGoals.points[level.key].threshold} onChange={(e) => handleGoalChange('points', level.key, 'threshold', e.target.value)} className="bg-input" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`points-${level.key}-prize`}>Prémio (R$)</Label>
                        <Input id={`points-${level.key}-prize`} type="number" placeholder="Prémio" value={localGoals.points[level.key].prize} onChange={(e) => handleGoalChange('points', level.key, 'prize', e.target.value)} className="bg-input" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metas de Gamificação */}
               <div className="border-t border-border pt-8">
                <h3 className="text-lg font-medium mb-4">Pontuação de Gamificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Pontos por Curso</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {gamificationLevels.map(level => (
                        <div key={`course-${level.key}`} className="space-y-1.5">
                          <Label htmlFor={`course-points-${level.key}`}>{level.label}</Label>
                          <Input id={`course-points-${level.key}`} type="number" placeholder="Pontos" value={localGoals.gamification.course[level.key]} onChange={(e) => handleGamificationChange('course', level.key, e.target.value)} className="bg-input" />
                        </div>
                      ))}
                    </div>
                  </div>
                   <div>
                    <h4 className="font-semibold mb-2">Pontos por Quiz</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {gamificationLevels.map(level => (
                        <div key={`quiz-${level.key}`} className="space-y-1.5">
                          <Label htmlFor={`quiz-points-${level.key}`}>{level.label}</Label>
                          <Input id={`quiz-points-${level.key}`} type="number" placeholder="Pontos" value={localGoals.gamification.quiz[level.key]} onChange={(e) => handleGamificationChange('quiz', level.key, e.target.value)} className="bg-input" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-border">
                <Button onClick={handleSaveAllChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Metas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ciclo" className="space-y-6 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Gestão de Ciclo</CardTitle>
              <CardDescription>Finalize o período atual para arquivar os resultados e iniciar um novo ciclo de premiação para a equipa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="size-6 text-destructive mt-1" />
                  <div>
                    <h4 className="font-semibold text-destructive">Atenção: Ação Irreversível</h4>
                    <p className="text-sm text-destructive/80 mt-1">
                      Ao finalizar o ciclo, todos os dados de performance (vendas, pontos, P.A., etc.) dos vendedores serão zerados para dar início a um novo período. Os dados do ciclo atual serão salvos no histórico para consulta.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="mt-4">
                          <RefreshCw className="mr-2" />
                          Finalizar Ciclo e Iniciar Novo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem a certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isto finalizará o ciclo de premiação atual, guardará um registo no histórico e zerará os dados de performance de todos os vendedores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleEndCycle}>Sim, finalizar ciclo</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
