'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, BookCopy, Trash2, GraduationCap, PlusCircle, Edit, FileText, X, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCourse } from "@/ai/flows/generate-course-flow";
import type { Course, QuizQuestion as QuizQuestionType } from '@/lib/types';
import { useAdminContext } from '@/contexts/AdminContext';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Certificate } from '@/components/Certificate';

// --- Dados para os Seletores ---
const BRANDS = ['Olympikus', 'Beira Rio', 'Moleca', 'Vizzano', 'Mizuno', 'Dakota', 'Mississipi', 'Outra'];
const PRODUCT_TYPES = ['Tênis', 'Sandália', 'Sapatilha', 'Bota', 'Chinelo', 'Scarpin', 'Mule', 'Outro'];


// --- Sub-componente: Pré-visualização do Certificado ---
const CertificatePreview = ({ course }: { course: Course }) => {
    const { sellers } = useAdminContext();
    const [selectedSellerId, setSelectedSellerId] = useState<string>('');

    const selectedSeller = useMemo(() =>
        sellers.find(s => s.id === selectedSellerId),
        [sellers, selectedSellerId]
    );

    const sellerNameForCertificate = selectedSeller?.name || "Nome do Vendedor (Exemplo)";
    const verificationCode = `ACGT-DEMO-${course.id?.substring(0, 4) || '0000'}`;
    const qrCodeValue = `https://apps-das-supermoda.netlify.app/verify?code=${verificationCode}`;

    return (
        <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0">
            {/* ✅ CORREÇÃO DE ACESSIBILIDADE APLICADA AQUI */}
            {/* Adicionado um DialogHeader com um DialogTitle apenas para leitores de tela (sr-only) */}
            <DialogHeader className="sr-only">
                <DialogTitle>Certificado de Conclusão: {course.title}</DialogTitle>
                <DialogDescription>
                    Pré-visualização do certificado de conclusão para o curso "{course.title}".
                </DialogDescription>
            </DialogHeader>

            <div className="absolute top-4 left-4 z-20 w-64">
                <Label className="text-white font-semibold text-shadow">Pré-visualizar para:</Label>
                <Select onValueChange={setSelectedSellerId}>
                    <SelectTrigger className="bg-white/90">
                        <SelectValue placeholder="Selecione um vendedor..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sellers.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Certificate
                courseTitle={course.title}
                sellerName={sellerNameForCertificate}
                verificationCode={verificationCode}
                qrCodeValue={qrCodeValue}
                performanceLevel="gold"
                achievements={["Competência Chave", "Destaque Prático"]}
            />
        </DialogContent>
    );
};


export default function AcademiaPage() {
    const { sellers } = useAdminContext();
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    // ... (resto dos seus estados) ...
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedProductType, setSelectedProductType] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<QuizQuestionType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const coursesCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/courses`;

    useEffect(() => {
        const coursesCollectionRef = collection(db, coursesCollectionPath);
        const unsubscribe = onSnapshot(coursesCollectionRef, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(coursesData);
            setLoadingCourses(false);
        }, () => {
            setLoadingCourses(false);
        });
        return () => unsubscribe();
    }, [coursesCollectionPath]);

    const filteredCourses = useMemo(() => {
        if (!searchTerm) return courses;
        return courses.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [courses, searchTerm]);

    const courseCompletions = useMemo(() => {
        const completions = new Map<string, number>();
        courses.forEach(course => {
            const count = sellers.filter(seller => seller.completedCourseIds?.includes(course.id!)).length;
            completions.set(course.id!, count);
        });
        return completions;
    }, [courses, sellers]);

    const handleQuizChange = (qIndex: number, field: keyof QuizQuestionType, value: any) => {
        const updatedQuiz = [...editingQuiz];
        const question = { ...updatedQuiz[qIndex] };
        if (field === 'options') {
            question.options[value.index] = value.value;
        } else {
            (question as any)[field] = field === 'correctAnswerIndex' ? parseInt(value, 10) : value;
        }
        updatedQuiz[qIndex] = question;
        setEditingQuiz(updatedQuiz);
    };

    const addQuizQuestion = () => setEditingQuiz([...editingQuiz, { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
    const removeQuizQuestion = (qIndex: number) => setEditingQuiz(editingQuiz.filter((_, i) => i !== qIndex));

    const openCourseModal = (course?: Course) => {
        setCurrentCourse(course || { title: '', content: '', quiz: [], points: 100, dificuldade: 'Médio' });
        setEditingQuiz(course?.quiz || []);
        setIsModalOpen(true);
    };

    const handleGenerateCourse = async () => {
        const topic = customTopic || `${selectedProductType} da marca ${selectedBrand}`;
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'Tópico necessário' });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateCourse({ topic });
            openCourseModal({ ...result, points: 100, dificuldade: 'Médio' } as Course);
            toast({ title: "Curso gerado pela IA!", description: "Revise e salve o conteúdo." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Falha ao Gerar Curso' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!currentCourse?.title) {
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
                await updateDoc(doc(db, coursesCollectionPath, currentCourse.id), finalCourseData);
                toast({ title: 'Curso atualizado!' });
            } else {
                await addDoc(collection(db, coursesCollectionPath), finalCourseData);
                toast({ title: 'Curso criado!' });
            }
            setIsModalOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este curso?')) {
            try {
                await deleteDoc(doc(db, coursesCollectionPath, courseId));
                toast({ title: 'Curso excluído.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao Excluir' });
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
                    <CardDescription>Gere cursos com IA ou crie um do zero.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Marca</Label><Select onValueChange={setSelectedBrand}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Tipo de Calçado</Label><Select onValueChange={setSelectedProductType}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div></div>
                    <div className="space-y-2"><Label>Tópico Customizado</Label><Input placeholder="Ex: Técnicas de venda para botas" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} /></div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button onClick={handleGenerateCourse} disabled={isGenerating} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Gerar com IA</Button>
                        <Button onClick={() => openCourseModal()} variant="secondary" className="flex-1"><PlusCircle className="mr-2 h-4 w-4" /> Criar Manualmente</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Cursos Criados</h3>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Buscar curso..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>
                </div>
                {loadingCourses ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCourses.map(course => (
                            <Card key={course.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate">{course.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 text-xs"><Users className="size-3" /><span>{courseCompletions.get(course.id!) || 0} / {sellers.length} concluíram</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow"><p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p></CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button onClick={() => openCourseModal(course)} size="sm" className="flex-1"><Edit className="mr-2 size-4" /> Editar</Button>
                                    <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><FileText className="mr-2 size-4" /> Certificado</Button></DialogTrigger><CertificatePreview course={course} /></Dialog>
                                    <Button onClick={() => handleDeleteCourse(course.id!)} variant="destructive" size="icon"><Trash2 className="size-4" /></Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <BookCopy className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">{searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso criado'}</p>
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
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="content">Conteúdo</TabsTrigger><TabsTrigger value="quiz">Quiz</TabsTrigger></TabsList>
                        <TabsContent value="content" className="flex-grow overflow-y-auto mt-4 pr-4 space-y-4">
                            <div className="space-y-2"><Label>Título</Label><Input value={currentCourse?.title || ''} onChange={(e) => setCurrentCourse(p => ({...p, title: e.target.value}))} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Pontos</Label><Input type="number" value={currentCourse?.points || 100} onChange={(e) => setCurrentCourse(p => ({...p, points: Number(e.target.value)}))} /></div>
                                <div className="space-y-2"><Label>Dificuldade</Label><Select value={currentCourse?.dificuldade || 'Médio'} onValueChange={(v) => setCurrentCourse(p => ({...p, dificuldade: v as any}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fácil">Fácil</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Difícil">Difícil</SelectItem></SelectContent></Select></div>
                            </div>
                            <div className="space-y-2"><Label>Conteúdo (Markdown)</Label><Textarea value={currentCourse?.content || ''} onChange={(e) => setCurrentCourse(p => ({...p, content: e.target.value}))} className="min-h-[300px] font-mono"/></div>
                        </TabsContent>
                        <TabsContent value="quiz" className="flex-grow overflow-y-auto mt-4 pr-4">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><h4 className="font-semibold">Editor de Quiz</h4><Button size="sm" onClick={addQuizQuestion}><PlusCircle className="mr-2 size-4" /> Adicionar</Button></div>
                                {editingQuiz.map((q, qIndex) => (
                                    <Card key={qIndex} className="bg-muted/50 p-4 space-y-3 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeQuizQuestion(qIndex)}><X className="size-4" /></Button>
                                        <Label>Pergunta {qIndex + 1}</Label><Input placeholder="Texto da pergunta" value={q.question} onChange={e => handleQuizChange(qIndex, 'question', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">{q.options.map((opt, oIndex) => (<Input key={oIndex} placeholder={`Opção ${oIndex + 1}`} value={opt} onChange={e => handleQuizChange(qIndex, 'options', {index: oIndex, value: e.target.value})} />))}</div>
                                        <Label>Resposta Correta</Label><Select value={String(q.correctAnswerIndex)} onValueChange={val => handleQuizChange(qIndex, 'correctAnswerIndex', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Opção 1</SelectItem><SelectItem value="1">Opção 2</SelectItem><SelectItem value="2">Opção 3</SelectItem><SelectItem value="3">Opção 4</SelectItem></SelectContent></Select>
                                        <Label>Explicação</Label><Textarea placeholder="Explicação..." value={q.explanation} onChange={e => handleQuizChange(qIndex, 'explanation', e.target.value)} rows={2} />
                                    </Card>
                                ))}
                                {editingQuiz.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">Nenhuma pergunta. Adicione uma!</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter className="mt-4 pt-4 border-t"><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveCourse} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Curso'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}