'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, BookCopy, Trash2, GraduationCap, Star, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { generateCourse } from "@/ai/flows/generate-course-flow";
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAdminContext } from '@/app/admin/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Dificuldade = 'Fácil' | 'Médio' | 'Difícil';


// Component for a single course quiz
const CourseQuiz = ({ course, onComplete }: { course: Course; onComplete: () => void }) => {
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(course.quiz.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        onComplete();
    };
    
    const allQuestionsAnswered = answers.every(a => a !== null);

    return (
        <div className="space-y-6">
            <h4 className="font-semibold text-lg">Teste seus conhecimentos</h4>
            {course.quiz.map((q, qIndex) => (
                <div key={qIndex} className={cn(
                    "p-4 rounded-lg bg-input transition-all",
                    submitted && (answers[qIndex] === q.correctAnswerIndex ? 'border-2 border-green-500' : 'border-2 border-destructive')
                )}>
                    <p><strong>{qIndex + 1}. {q.question}</strong></p>
                    <RadioGroup
                        value={answers[qIndex]?.toString()}
                        onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                        disabled={submitted}
                        className="mt-2 space-y-2"
                    >
                        {q.options.map((opt, oIndex) => (
                            <Label key={oIndex} htmlFor={`q${qIndex}-o${oIndex}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-background/50 cursor-pointer">
                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                                <span>{opt}</span>
                            </Label>
                        ))}
                    </RadioGroup>
                    {submitted && (
                        <div className="mt-3 text-sm flex items-center gap-2">
                             {answers[qIndex] === q.correctAnswerIndex 
                                ? <CheckCircle className="size-4 text-green-500" />
                                : <XCircle className="size-4 text-destructive" />}
                            <p><span className="font-bold">Explicação:</span> {q.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered || submitted}>
                {submitted ? 'Quiz Finalizado' : 'Finalizar Quiz e Concluir Curso'}
            </Button>
        </div>
    );
};


export default function AcademiaPage() {
  const { sellers, setSellers, goals } = useAdminContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('Médio');
  const { toast } = useToast();
  
  const coursePointsConfig = goals.gamification.course;

  const courseTopics = [
    'Técnicas de Atendimento ao Cliente para Lojas de Calçados',
    'Conhecimento de Materiais: Couro, Sintéticos e Tecidos',
    'Como Lidar com Objeções de Clientes e Fechar Vendas',
    'Organização de Estoque e Vitrinismo para Calçados',
    'Vendas Adicionais: Como Oferecer Meias e Produtos de Limpeza'
  ];

  const handleGenerateCourse = async () => {
     if (!selectedTopic) {
        toast({
            variant: 'destructive',
            title: 'Selecione um tópico',
            description: 'Você precisa escolher um tópico para gerar o curso.',
        });
        return;
    }
    setIsGeneratingCourse(true);
    try {
      const seed = new Date().getTime().toString();
      const result = await generateCourse({ topic: selectedTopic, seed, dificuldade });
      const points = coursePointsConfig[dificuldade];
      const newCourse: Course = {
        id: new Date().getTime().toString(),
        ...result,
        points,
        dificuldade,
      };
      setCourses(prev => [newCourse, ...prev]);
      toast({
        title: "Curso Gerado com Sucesso!",
        description: `O curso "${result.title}" foi criado.`,
      });
    } catch (error) {
      console.error("Failed to generate course:", error);
      toast({
        variant: 'destructive',
        title: 'Falha ao Gerar Curso',
        description: 'A IA não conseguiu gerar o conteúdo. Um curso padrão foi carregado.',
      });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleCompleteCourse = (courseId: string) => {
    if (!selectedSellerId) {
        toast({
            variant: 'destructive',
            title: 'Nenhum Vendedor Selecionado',
            description: 'Por favor, selecione um vendedor para premiar.',
        });
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const sellerToUpdate = sellers.find(s => s.id === selectedSellerId);
    const course = courses.find(c => c.id === courseId);

    if (!course) return;

    if (sellerToUpdate?.lastCourseCompletionDate === today) {
        toast({
            variant: 'destructive',
            title: 'Limite Diário Atingido',
            description: `${sellerToUpdate.name} já concluiu um curso hoje.`,
        });
        return;
    }

    setSellers(prevSellers =>
        prevSellers.map(seller =>
            seller.id === selectedSellerId
            ? { ...seller, points: seller.points + course.points, lastCourseCompletionDate: today }
            : seller
        )
    );

    toast({
        title: 'Curso Concluído!',
        description: `${sellerToUpdate?.name} ganhou ${course.points} pontos pelo curso "${course.title}".`,
    });
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <GraduationCap className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Academia de Vendas</h1>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl">Gerador de Cursos</CardTitle>
          <CardDescription>
            Selecione um tópico e um grau de dificuldade. A pontuação é configurável na tela de Metas.
             <span className="ml-2 font-bold text-green-400">
                Fácil: {coursePointsConfig['Fácil']}pts | Médio: {coursePointsConfig['Médio']}pts | Difícil: {coursePointsConfig['Difícil']}pts
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                <div className="space-y-2 flex-grow">
                    <Label htmlFor="course-topic-select">Tópico do Curso</Label>
                    <Select onValueChange={setSelectedTopic} value={selectedTopic}>
                        <SelectTrigger id="course-topic-select">
                            <SelectValue placeholder="Escolha um tópico..." />
                        </SelectTrigger>
                        <SelectContent>
                            {courseTopics.map((topic, index) => (
                                <SelectItem key={index} value={topic}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:min-w-[180px]">
                  <Label htmlFor="dificuldade-select">Dificuldade</Label>
                  <Select value={dificuldade} onValueChange={v => setDificuldade(v as Dificuldade)}>
                    <SelectTrigger id="dificuldade-select">
                      <SelectValue placeholder="Dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(coursePointsConfig).map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateCourse} disabled={isGeneratingCourse || !selectedTopic} className="bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground font-semibold">
                  {isGeneratingCourse ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Gerar Curso com IA
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-semibold">Cursos Gerados</h3>
        
        {courses.length > 0 && (
          <div className="space-y-2 max-w-sm mb-4">
            <Label htmlFor="seller-select-academia">Premiar Vendedor</Label>
            <Select onValueChange={setSelectedSellerId}>
              <SelectTrigger id="seller-select-academia">
                <SelectValue placeholder="Selecione um vendedor..." />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Selecione um vendedor para concluir cursos e receber pontos.</p>
          </div>
        )}

        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="bg-background/50">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                           <Star className="mr-2 size-4 text-yellow-400" />
                           <span>{course.points} Pontos de Recompensa</span>
                           {course.dificuldade && <span className="ml-2 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{course.dificuldade}</span>}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)} aria-label="Remover curso">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                        <ReactMarkdown>{course.content}</ReactMarkdown>
                    </div>

                    {course.quiz && course.quiz.length > 0 && (
                        <div className="pt-6 border-t">
                            <CourseQuiz course={course} onComplete={() => handleCompleteCourse(course.id)} />
                        </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-8">
            <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Nenhum curso gerado</p>
            <p className="text-sm">Gere um novo curso com IA para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
