'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, GraduationCap, CheckCircle, Award, ArrowLeft, BookCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSellerContext } from '@/contexts/SellerContext';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Certificate } from '@/components/Certificate';

// --- Sub-componente para o Quiz ---
const CourseQuiz = ({ course, onComplete }: { course: Course; onComplete: (score: number, passed: boolean) => void }) => {
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(course.quiz.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const passingScore = Math.ceil(course.quiz.length * 0.7); // 70% para passar

    const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        const correctAnswers = answers.filter((answer, index) => answer === course.quiz[index].correctAnswerIndex).length;
        onComplete(correctAnswers, correctAnswers >= passingScore);
    };
    
    const allQuestionsAnswered = answers.every(a => a !== null);

    return (
        <div className="space-y-6 mt-6 pt-6 border-t">
            <h4 className="font-semibold text-lg text-primary">Teste seus conhecimentos</h4>
            {course.quiz.map((q, qIndex) => (
                <div key={qIndex} className={cn("p-4 rounded-lg bg-input/50 transition-all", submitted && (answers[qIndex] === q.correctAnswerIndex ? 'border-2 border-green-500' : 'border-2 border-destructive'))}>
                    <p><strong>{qIndex + 1}. {q.question}</strong></p>
                    <RadioGroup value={answers[qIndex]?.toString()} onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))} disabled={submitted} className="mt-2 space-y-2">
                        {q.options.map((opt, oIndex) => (
                            <Label key={oIndex} htmlFor={`q${qIndex}-o${oIndex}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50 cursor-pointer text-sm">
                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                                <span>{opt}</span>
                            </Label>
                        ))}
                    </RadioGroup>
                    {submitted && (
                        <div className="mt-4 text-xs p-3 rounded-md bg-background/70">
                            <p className="font-bold">Explicação:</p>
                            <p>{q.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered || submitted} className="w-full font-bold">
                {submitted ? 'Curso Concluído!' : 'Finalizar e Ver Resultado'}
            </Button>
        </div>
    );
};

// --- Sub-componente para a Visualização do Curso ---
const CourseView = ({ course, onBack, onComplete }: { course: Course; onBack: () => void; onComplete: (score: number, passed: boolean) => void }) => {
    const { currentSeller } = useSellerContext();
    const isCompleted = currentSeller?.completedCourseIds?.includes(course.id!);
    
    const score = 9;
    const totalQuestions = 10;
    const performance = score / totalQuestions;
    let performanceLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (performance >= 0.95) performanceLevel = 'platinum';
    else if (performance >= 0.85) performanceLevel = 'gold';
    else if (performance >= 0.7) performanceLevel = 'silver';

    return (
        <div className="space-y-4">
            <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 size-4"/>Voltar para a lista</Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription>{course.points} pontos de recompensa</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground"><ReactMarkdown>{course.content}</ReactMarkdown></div>
                    {isCompleted ? (
                        <div className="mt-6 pt-6 border-t text-center space-y-4">
                            <h3 className="font-bold text-lg text-green-500 flex items-center justify-center gap-2"><CheckCircle/> Curso Concluído!</h3>
                            <Dialog>
                                <DialogTrigger asChild><Button variant="secondary"><Award className="mr-2 size-4" /> Ver o meu Certificado</Button></DialogTrigger>
                                <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0">
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>Certificado de Conclusão: {course.title}</DialogTitle>
                                        <DialogDescription>
                                            Este é o seu certificado de conclusão para o curso &quot;{course.title}&quot;.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Certificate 
                                        courseTitle={course.title}
                                        sellerName={currentSeller?.name || 'Vendedor'}
                                        verificationCode={`ACGT-${new Date().getFullYear()}-${currentSeller?.name.substring(0,2).toUpperCase()}-${course.id!.substring(0,4)}`}
                                        qrCodeValue={`https://apps-das-supermoda.netlify.app/verify?id=${course.id!}-${currentSeller?.id}`}
                                        performanceLevel={performanceLevel}
                                        achievements={["Negociação", "Pós-venda"]}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <CourseQuiz course={course} onComplete={onComplete} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// --- Componente da Página Principal ---
export default function SellerAcademiaPage() {
    const { currentSeller, setSellers } = useSellerContext();
    const { toast } = useToast();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const coursesCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/courses`;
    
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, coursesCollectionPath));
                setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
            } catch {
                toast({ variant: 'destructive', title: 'Erro ao Carregar Cursos' });
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [toast, coursesCollectionPath]);

    const handleCompleteCourse = async (score: number, passed: boolean) => {
        if (!selectedCourse || !currentSeller) return;

        const isAlreadyCompleted = currentSeller.completedCourseIds?.includes(selectedCourse.id!);
        if(isAlreadyCompleted) {
            toast({ title: 'Curso já concluído' });
            return;
        }

        if (!passed) {
            toast({ variant: 'destructive', title: 'Não foi desta vez!', description: `Você acertou ${score} de ${selectedCourse.quiz.length}. Tente novamente.` });
            return;
        }

        const pointsEarned = selectedCourse.points || 0;
        
        try {
            const sellerRef = doc(db, 'sellers', currentSeller.id);
            await updateDoc(sellerRef, {
                points: (currentSeller.points || 0) + pointsEarned,
                completedCourseIds: arrayUnion(selectedCourse.id),
                lastCourseCompletionDate: Timestamp.now()
            });

            setSellers(prevSellers => prevSellers.map(s => s.id === currentSeller.id ? {
                ...s,
                points: (s.points || 0) + pointsEarned,
                completedCourseIds: [...(s.completedCourseIds || []), selectedCourse.id!]
            } : s));
            
            toast({ title: 'Parabéns!', description: `Você passou no teste e ganhou ${pointsEarned} pontos!` });
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao Salvar Progresso' });
        }
    };

    if (loading || !currentSeller) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (selectedCourse) {
        return <CourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} onComplete={handleCompleteCourse} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <GraduationCap className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Academia de Vendas</h1>
            </div>
            
            {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => {
                        const isCompleted = currentSeller.completedCourseIds?.includes(course.id!);
                        return (
                            <Card key={course.id} className="flex flex-col hover:border-primary/50 transition-all">
                                <CardHeader>
                                    <CardTitle className="text-lg">{course.title}</CardTitle>
                                    <CardDescription>{course.points} Pontos</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => setSelectedCourse(course)} className="w-full">
                                        {isCompleted ? <><CheckCircle className="mr-2 size-4"/> Revisar Curso</> : "Iniciar Curso"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <BookCopy className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">Nenhum curso disponível</p>
                    <p className="text-sm">Volte mais tarde para novas formações!</p>
                </div>
            )}
        </div>
    );
}