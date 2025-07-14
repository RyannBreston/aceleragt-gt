'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, BookCopy, Trash2, GraduationCap, PlusCircle, Edit, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { generateCourse } from "@/ai/flows/generate-course-flow";
import type { Course, QuizQuestion as QuizQuestionType } from '@/lib/types';
import { useAdminContext } from '@/app/admin/layout';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Certificate } from '@/components/Certificate'; // Importação do novo componente

// --- Dados para os Seletores ---
const BRANDS = ['Olympikus', 'Beira Rio', 'Moleca', 'Vizzano', 'Mizuno', 'Dakota', 'Mississipi', 'Outra'];
const PRODUCT_TYPES = ['Tênis', 'Sandália', 'Sapatilha', 'Bota', 'Chinelo', 'Scarpin', 'Mule', 'Outro'];

export default function AcademiaPage() {
  const { sellers } = useAdminContext();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestionType[]>([]);
  
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const coursesCollectionPath = `artifacts/${appId}/public/data/courses`;

  useEffect(() => {
    const coursesCollectionRef = collection(db, coursesCollectionPath);
    const unsubscribe = onSnapshot(coursesCollectionRef, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesData);
      setLoadingCourses(false);
    }, (error) => {
        console.error("Erro ao carregar cursos: ", error);
        toast({
            variant: "destructive",
            title: "Erro de Permissão",
            description: "Não foi possível carregar os cursos. Verifique as regras de segurança do Firestore.",
        });
        setLoadingCourses(false);
    });
    return () => unsubscribe();
  }, [appId, toast, coursesCollectionPath]);

  const handleQuizChange = (qIndex: number, field: keyof QuizQuestionType, value: any) => {
    const updatedQuiz = [...editingQuiz];
    const question = { ...updatedQuiz[qIndex] };
    
    if (field === 'options') {
      question.options[value.index] = value.value;
    } else if (field === 'correctAnswerIndex') {
        question.correctAnswerIndex = parseInt(value, 10);
    } 
    else {
      (question as any)[field] = value;
    }
    
    updatedQuiz[qIndex] = question;
    setEditingQuiz(updatedQuiz);
  };

  const addQuizQuestion = () => {
    setEditingQuiz([...editingQuiz, { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
  };

  const removeQuizQuestion = (qIndex: number) => {
    setEditingQuiz(editingQuiz.filter((_, i) => i !== qIndex));
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setCurrentCourse(course);
      setEditingQuiz(course.quiz || []);
    } else {
      setCurrentCourse({ title: '', content: '', quiz: [], points: 100, dificuldade: 'Médio' });
      setEditingQuiz([]);
    }
    setIsModalOpen(true);
  };

  const handleGenerateCourse = async () => {
    const topic = customTopic || `${selectedProductType} da marca ${selectedBrand}`;
    if (!topic.trim()) {
      toast({ variant: 'destructive', title: 'Tópico necessário', description: 'Por favor, selecione uma marca, tipo ou descreva um tópico customizado.' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCourse({ topic });
      const newCourse: Partial<Course> = {
        ...result,
        points: 100,
        dificuldade: 'Médio',
      };
      openCourseModal(newCourse as Course);
      toast({ title: "Curso gerado pela IA!", description: "Revise e salve o conteúdo gerado." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Falha ao Gerar Curso', description: 'Tente novamente ou crie um manualmente.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!currentCourse || !currentCourse.title) {
        toast({ variant: 'destructive', title: 'Título é obrigatório!' });
        return;
    }
    
    setIsSubmitting(true);
    const finalCourseData = {
        title: currentCourse.title,
        content: currentCourse.content || '',
        quiz: editingQuiz,
        points: currentCourse.points || 100,
        dificuldade: currentCourse.dificuldade || 'Médio',
    };

    try {
        if (currentCourse.id) {
            const courseRef = doc(db, coursesCollectionPath, currentCourse.id);
            await updateDoc(courseRef, finalCourseData);
            toast({ title: 'Curso atualizado com sucesso!' });
        } else {
            const coursesCollectionRef = collection(db, coursesCollectionPath);
            await addDoc(coursesCollectionRef, finalCourseData);
            toast({ title: 'Curso criado com sucesso!' });
        }
        setIsModalOpen(false);
    } catch (error) {
        console.error("Erro ao salvar curso:", error);
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o curso no banco de dados.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
        try {
            await deleteDoc(doc(db, coursesCollectionPath, courseId));
            toast({ title: 'Curso excluído.' });
        } catch (error) {
            console.error("Erro ao excluir curso:", error);
            toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir o curso.' });
        }
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <GraduationCap className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Academia de Vendas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Criador de Cursos</CardTitle>
          <CardDescription>Gere cursos com IA baseados em marcas e produtos, ou crie um do zero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select onValueChange={setSelectedBrand}><SelectTrigger><SelectValue placeholder="Selecione a marca..." /></SelectTrigger><SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Calçado</Label>
              <Select onValueChange={setSelectedProductType}><SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="relative">
             <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
             <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div>
          </div>
          <div className="space-y-2">
              <Label>Tópico Customizado</Label>
              <Input placeholder="Ex: Técnicas de venda para botas de inverno" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button onClick={handleGenerateCourse} disabled={isGenerating} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground font-semibold">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar com IA
            </Button>
            <Button onClick={() => openCourseModal()} variant="secondary" className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Curso Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cursos Criados</h3>
        {loadingCourses ? (
            <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{course.title}</CardTitle>
                  <CardDescription>{course.quiz?.length || 0} perguntas no quiz.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button onClick={() => openCourseModal(course)} size="sm" className="flex-1"><Edit className="mr-2 size-4" /> Editar</Button>
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><FileText className="mr-2 size-4" /> Ver Certificado</Button></DialogTrigger>
                    <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0"><Certificate courseTitle={course.title} sellerName="Nome do Vendedor" /></DialogContent>
                  </Dialog>
                  <Button onClick={() => handleDeleteCourse(course.id)} variant="destructive" size="icon"><Trash2 className="size-4" /></Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <BookCopy className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">Nenhum curso criado</p>
            <p className="text-sm">Use as opções acima para começar.</p>
          </div>
        )}
      </div>

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentCourse?.id ? 'Editar Curso' : 'Criar Novo Curso'}</DialogTitle>
            <DialogDescription>Preencha os detalhes e o quiz do curso.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="content" className="flex-grow flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="flex-grow overflow-y-auto mt-4 pr-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título do Curso</Label>
                    <Input id="title" value={currentCourse?.title || ''} onChange={(e) => setCurrentCourse(p => ({...p, title: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="points">Pontos de Recompensa</Label>
                        <Input id="points" type="number" value={currentCourse?.points || 100} onChange={(e) => setCurrentCourse(p => ({...p, points: Number(e.target.value)}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dificuldade">Dificuldade</Label>
                        <Select value={currentCourse?.dificuldade || 'Médio'} onValueChange={(v) => setCurrentCourse(p => ({...p, dificuldade: v as any}))}>
                            <SelectTrigger id="dificuldade"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fácil">Fácil</SelectItem>
                                <SelectItem value="Médio">Médio</SelectItem>
                                <SelectItem value="Difícil">Difícil</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo (Markdown)</Label>
                    <Textarea id="content" value={currentCourse?.content || ''} onChange={(e) => setCurrentCourse(p => ({...p, content: e.target.value}))} className="min-h-[300px] font-mono"/>
                </div>
            </TabsContent>
            <TabsContent value="quiz" className="flex-grow overflow-y-auto mt-4 pr-4">
                <div className="space-y-4">
                   <div className="flex justify-between items-center sticky top-0 bg-background py-2">
                     <h4 className="font-semibold">Editor de Quiz</h4>
                     <Button size="sm" onClick={addQuizQuestion}><PlusCircle className="mr-2 size-4" /> Adicionar Pergunta</Button>
                   </div>
                    {editingQuiz.map((q, qIndex) => (
                      <Card key={qIndex} className="bg-muted/50 p-4 space-y-3 relative">
                         <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeQuizQuestion(qIndex)}><X className="size-4" /></Button>
                         <Label>Pergunta {qIndex + 1}</Label>
                         <Input placeholder="Texto da pergunta" value={q.question} onChange={e => handleQuizChange(qIndex, 'question', e.target.value)} />
                         <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIndex) => (
                            <Input key={oIndex} placeholder={`Opção ${oIndex + 1}`} value={opt} onChange={e => handleQuizChange(qIndex, 'options', {index: oIndex, value: e.target.value})} />
                          ))}
                         </div>
                         <Label>Resposta Correta</Label>
                         <Select value={String(q.correctAnswerIndex)} onValueChange={val => handleQuizChange(qIndex, 'correctAnswerIndex', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Opção 1</SelectItem>
                              <SelectItem value="1">Opção 2</SelectItem>
                              <SelectItem value="2">Opção 3</SelectItem>
                              <SelectItem value="3">Opção 4</SelectItem>
                            </SelectContent>
                         </Select>
                         <Label>Explicação da Resposta</Label>
                         <Textarea placeholder="Explicação..." value={q.explanation} onChange={e => handleQuizChange(qIndex, 'explanation', e.target.value)} rows={2} />
                      </Card>
                    ))}
                   {editingQuiz.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">Nenhuma pergunta no quiz. Adicione uma!</p>}
                </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCourse} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>

    </div>
  );
}