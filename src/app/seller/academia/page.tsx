'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, GraduationCap, CheckCircle, Award, ArrowLeft, Download, BookCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import type { Course, QuizQuestion as QuizQuestionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSellerContext } from '@/contexts/SellerContext'; // Caminho de importação corrigido
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Certificate } from '@/components/Certificate';

// --- Componente do Quiz do Curso ---
const CourseQuiz = ({ course, onComplete }: { course: Course; onComplete: (score: number) => void }) => {
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(course.quiz.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        const correctAnswers = answers.filter((answer, index) => answer === course.quiz[index].correctAnswerIndex).length;
        onComplete(correctAnswers);
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

// --- Página Principal da Academia ---
export default function SellerAcademiaPage() {
  const { currentSeller, setSellers } = useSellerContext();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const coursesCollectionPath = `artifacts/${appId}/public/data/courses`;
  
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesCollectionRef = collection(db, coursesCollectionPath);
        const snapshot = await getDocs(coursesCollectionRef);
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(coursesData);
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Erro ao Carregar Cursos', description: "Não foi possível buscar os cursos. Tente novamente." });
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [appId, toast, coursesCollectionPath]);

  const handleCompleteCourse = async (score: number) => {
      if (!selectedCourse || !currentSeller) return;

      const isAlreadyCompleted = currentSeller.completedCourseIds?.includes(selectedCourse.id);
      if(isAlreadyCompleted) {
          toast({ title: 'Curso já concluído', description: 'Você já ganhou os pontos por este curso.' });
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
            completedCourseIds: [...(s.completedCourseIds || []), selectedCourse.id]
        } : s));
        
        toast({
            title: 'Parabéns!',
            description: `Você acertou ${score} de ${selectedCourse.quiz.length} e ganhou ${pointsEarned} pontos!`,
        });

      } catch (error) {
          toast({ variant: 'destructive', title: 'Erro ao Salvar Progresso' });
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-semibold">Carregando cursos disponíveis...</p>
      </div>
    );
  }

  if (selectedCourse) {
      const isCompleted = currentSeller?.completedCourseIds?.includes(selectedCourse.id);
      return (
          <div className="space-y-4">
              <Button onClick={() => setSelectedCourse(null)} variant="outline"><ArrowLeft className="mr-2 size-4"/>Voltar para a lista de cursos</Button>
              <Card>
                  <CardHeader>
                      <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                      <CardDescription>{selectedCourse.points} pontos de recompensa</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                          <ReactMarkdown>{selectedCourse.content}</ReactMarkdown>
                      </div>
                      {isCompleted ? (
                          <div className="mt-6 pt-6 border-t text-center text-green-500 font-bold flex items-center justify-center gap-2">
                              <CheckCircle/> Curso Concluído!
                          </div>
                      ) : (
                          <CourseQuiz course={selectedCourse} onComplete={handleCompleteCourse} />
                      )}
                  </CardContent>
              </Card>
          </div>
      )
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
                  const isCompleted = currentSeller?.completedCourseIds?.includes(course.id);
                  return (
                      <Card key={course.id} className="flex flex-col hover:border-primary/50 transition-all">
                          <CardHeader>
                              <CardTitle>{course.title}</CardTitle>
                              <CardDescription>{course.points} Pontos</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p>
                          </CardContent>
                          <CardFooter>
                              {isCompleted ? (
                                  <Dialog>
                                      <DialogTrigger asChild>
                                          <Button variant="secondary" className="w-full"><Award className="mr-2 size-4" /> Ver Certificado</Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0">
                                          <Certificate courseTitle={course.title} sellerName={currentSeller?.name || 'Vendedor'} />
                                      </DialogContent>
                                  </Dialog>
                              ) : (
                                  <Button onClick={() => setSelectedCourse(course)} className="w-full">Iniciar Curso</Button>
                              )}
                          </CardFooter>
                      </Card>
                  )
              })}
          </div>
      ) : (
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <BookCopy className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">Nenhum curso disponível</p>
            <p className="text-sm">O administrador ainda não publicou nenhum curso. Volte mais tarde!</p>
          </div>
      )}
    </div>
  );
}