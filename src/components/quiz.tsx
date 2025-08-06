'use client';

import React, { useState, useContext, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, QuizQuestion, QuizResult } from '@/lib/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// ✅ IMPORTAÇÃO CORRIGIDA AQUI
import { useSellerContext } from '@/contexts/SellerContext'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Função para salvar o resultado (sem alterações)
const saveResultToLocalStorage = (result: QuizResult) => {
    try {
        const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        existingResults.push(result);
        localStorage.setItem('quizResults', JSON.stringify(existingResults));
    } catch (error) {
        console.error("Erro ao salvar resultado no localStorage:", error);
    }
};

export default function QuizComponent({ quizData }: { quizData: Quiz }) {
    const { toast } = useToast();
    const { currentSeller } = useSellerContext(); // Usa o hook corrigido
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(quizData.questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        const correctAnswers = answers.filter((answer, index) => answer === quizData.questions[index].correctAnswerIndex).length;
        const totalQuestions = quizData.questions.length;
        const score = (correctAnswers / totalQuestions) * 100;

        const quizResult: QuizResult = {
            quizId: quizData.id,
            quizTitle: quizData.title,
            sellerId: currentSeller?.id || 'unknown',
            sellerName: currentSeller?.name || 'Unknown Seller',
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            timestamp: new Date(),
        };

        setResult(quizResult);
        setSubmitted(true);
        saveResultToLocalStorage(quizResult);

        setIsSaving(true);
        try {
            const resultsCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/quizResults`;
            await addDoc(collection(db, resultsCollectionPath), quizResult);
            toast({
                title: "Resultado Submetido!",
                description: `Você acertou ${correctAnswers} de ${totalQuestions}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar Resultado',
                description: 'O seu resultado foi salvo localmente, mas não foi possível enviá-lo.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const allQuestionsAnswered = answers.every(a => a !== null);

    if (submitted && result) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Resultado do Quiz: {quizData.title}</CardTitle>
                    <CardDescription>Confira o seu desempenho.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-5xl font-bold">{result.score.toFixed(0)}%</p>
                    <p className="text-lg text-muted-foreground">Você acertou {result.correctAnswers} de {result.totalQuestions} perguntas.</p>
                    {isSaving && <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> A guardar resultado...</div>}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {quizData.questions.map((q, qIndex) => (
                <Card key={qIndex}>
                    <CardHeader>
                        <CardTitle>Pergunta {qIndex + 1}</CardTitle>
                        <CardDescription>{q.question}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}>
                            {q.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                    <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                                    <Label htmlFor={`q${qIndex}-o${oIndex}`}>{option}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
            ))}
            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered} className="w-full">
                Finalizar e Ver Resultado
            </Button>
        </div>
    );
}