'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, QuizQuestion as QuizQuestionType, CourseDifficulty } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';

interface CourseEditorModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  course: Partial<Course> | null;
  collectionPath: string;
}

export const CourseEditorModal = ({ isOpen, setIsOpen, course, collectionPath }: CourseEditorModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({ title: '', content: '', points: 100, dificuldade: 'Médio', quiz: [] });
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestionType[]>([]);

  useEffect(() => {
    if (isOpen && course) {
      setCurrentCourse(course);
      setEditingQuiz(course.quiz || []);
    } else if (isOpen) {
      setCurrentCourse({ title: '', content: '', points: 100, dificuldade: 'Médio', quiz: [] });
      setEditingQuiz([]);
    }
  }, [course, isOpen]);

  const handleQuizChange = (qIndex: number, field: keyof QuizQuestionType | 'options', value: string | number | { index: number; value: string }) => {
    setEditingQuiz(prevQuiz => {
        const updatedQuiz = [...prevQuiz];
        const question = { ...updatedQuiz[qIndex] };

        if (field === 'options' && typeof value === 'object' && 'index' in value) {
            question.options[value.index] = value.value;
        } else if (field === 'question' && typeof value === 'string') {
            question.question = value;
        } else if (field === 'explanation' && typeof value === 'string') {
            question.explanation = value;
        } else if (field === 'correctAnswerIndex') {
            question.correctAnswerIndex = Number(value);
        }
        
        updatedQuiz[qIndex] = question;
        return updatedQuiz;
    });
  };

  const addQuizQuestion = () => setEditingQuiz([...editingQuiz, { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
  const removeQuizQuestion = (qIndex: number) => setEditingQuiz(editingQuiz.filter((_, i) => i !== qIndex));

  const handleSaveCourse = async () => {
    if (!currentCourse?.title) {
        toast({ variant: 'destructive', title: 'Título é obrigatório!' });
        return;
    }
    setIsSubmitting(true);
    const finalCourseData = {
        ...currentCourse,
        quiz: editingQuiz,
    };
    try {
        if (currentCourse.id) {
            await updateDoc(doc(db, collectionPath, currentCourse.id), finalCourseData);
            toast({ title: 'Curso atualizado!' });
        } else {
            await addDoc(collection(db, collectionPath), finalCourseData);
            toast({ title: 'Curso criado!' });
        }
        setIsOpen(false);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{currentCourse?.id ? 'Editar Curso' : 'Criar Novo Curso'}</DialogTitle>
          <DialogDescription>Preencha os detalhes e o quiz do curso.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="content" className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="content">Conteúdo</TabsTrigger><TabsTrigger value="quiz">Quiz</TabsTrigger></TabsList>
          <TabsContent value="content" className="flex-grow overflow-y-auto mt-4 pr-4 space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={currentCourse?.title || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentCourse(p => ({...p, title: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Pontos</Label><Input type="number" value={currentCourse?.points || 100} onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentCourse(p => ({...p, points: Number(e.target.value)}))} /></div>
              <div className="space-y-2"><Label>Dificuldade</Label><Select value={currentCourse?.dificuldade || 'Médio'} onValueChange={(v: CourseDifficulty) => setCurrentCourse(p => ({...p, dificuldade: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fácil">Fácil</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Difícil">Difícil</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Conteúdo (Markdown)</Label><Textarea value={currentCourse?.content || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentCourse(p => ({...p, content: e.target.value}))} className="min-h-[300px] font-mono"/></div>
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
        <DialogFooter className="mt-4 pt-4 border-t"><Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={handleSaveCourse} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Curso'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};