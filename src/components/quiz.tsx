'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import type { GenerateQuizOutput, QuizResult, QuizQuestion, Goals } from '@/lib/types';
import { Loader2, Sparkles, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import PerformanceChart from './PerformanceChart';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SellerContext } from '@/contexts/SellerContext'; // Caminho de importação corrigido
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const saveResultToLocalStorage = (result: QuizResult) => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('quizResults');
  const results: QuizResult[] = stored ? JSON.parse(stored) : [];
  results.unshift(result);
  localStorage.setItem('quizResults', JSON.stringify(results.slice(0, 5)));
};

const getResultsFromLocalStorage = (): QuizResult[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('quizResults');
  return stored ? JSON.parse(stored) : [];
};

type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

interface QuizProps {
    goals: Goals;
}

export default function Quiz({ goals }: QuizProps) {
  const sellerContext = useContext(SellerContext);
  const isSellerView = !!sellerContext;
  const { currentSeller, setSellers } = sellerContext || {};
  
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Médio');
  const { toast } = useToast();
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);

  const difficultyConfig = goals.gamification.quiz;

  useEffect(() => {
    setQuizHistory(getResultsFromLocalStorage());
  }, [isFinished]);

  const handleStartQuiz = async () => {
    if (isSellerView && currentSeller?.hasCompletedQuiz) {
        toast({ variant: 'destructive', title: 'Quiz já realizado', description: 'Você pode realizar o quiz apenas uma vez por dia.' });
        return;
    }
    setIsLoading(true);
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsFinished(false);

    const seed = isSellerView && currentSeller
      ? `${new Date().toISOString().split('T')[0]}-${currentSeller.id}-${difficulty}`
      : new Date().getTime().toString();

    try {
      const result = await generateQuiz({
        topic: 'Técnicas de Venda e Conhecimento de Produtos em Lojas de Calçados',
        numberOfQuestions: 5,
        difficulty: difficulty,
        seed: seed,
      });

      if (result.questions.length > 0) {
        setQuiz(result);
      } else {
        throw new Error('Quiz vazio retornado pelo fallback.');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Falha ao Gerar Quiz',
        description: 'A IA não conseguiu gerar o conteúdo. Um quiz de emergência foi carregado.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
    if (selectedAnswer === quiz!.questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      const pointsPerCorrectAnswer = difficultyConfig[difficulty];
      const pointsEarned = score * pointsPerCorrectAnswer;

      const finalResult: QuizResult = {
        score: score,
        total: quiz!.questions.length,
        date: new Date().toLocaleDateString('pt-BR'),
      };
      
      if (isSellerView && setSellers && currentSeller) {
        setSellers(prevSellers =>
            prevSellers.map(seller =>
                seller.id === currentSeller.id
                ? { ...seller, points: seller.points + pointsEarned, hasCompletedQuiz: true }
                : seller
            )
        );
        toast({
            title: "Pontuação Registrada!",
            description: `${currentSeller?.name} ganhou ${pointsEarned} pontos.`,
        });
      }

      saveResultToLocalStorage(finalResult);
      if (isSellerView && currentSeller) {
        try {
          await addDoc(collection(db, 'quiz-results'), {...finalResult, sellerId: currentSeller.id, sellerName: currentSeller?.name, difficulty: difficulty });
          console.log('🔥 Resultado salvo no Firestore!');
        } catch (err) {
          console.error('❌ Erro ao salvar no Firestore:', err);
        }
      }
    }
  };

  const handleReset = () => {
    setQuiz(null);
    setIsFinished(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }

  const currentQuestion: QuizQuestion | null = quiz ? quiz.questions[currentQuestionIndex] : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-semibold">Gerando um novo quiz para você...</p>
        <p className="text-sm">Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (isFinished) {
    const pointsPerCorrectAnswer = difficultyConfig[difficulty];
    const pointsEarned = score * pointsPerCorrectAnswer;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Trophy className="h-16 w-16 text-yellow-400" />
        <h2 className="mt-4 text-2xl font-bold">Quiz Finalizado!</h2>
        <p className="text-muted-foreground mt-2">
          {isSellerView && currentSeller ? `${currentSeller.name} acertou ${score} de ${quiz!.questions.length} perguntas e ganhou ${pointsEarned} pontos!` : `Você acertou ${score} de ${quiz!.questions.length} perguntas.`}
        </p>

        <PerformanceChart data={quizHistory} />

        <Button onClick={handleReset} className="mt-6">
          <ArrowLeft className="mr-2" /> Voltar ao Início
        </Button>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    const hasCompleted = isSellerView && currentSeller?.hasCompletedQuiz;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold">Pronto para o Desafio?</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {isSellerView
            ? 'Gere seu quiz único e aleatório de hoje. Ele é personalizado para você e não se repetirá. Você tem apenas uma tentativa por dia.'
            : 'Gere um quiz para testar seus conhecimentos.'}
        </p>

        <div className="space-y-4 my-6 w-full max-w-sm">
             <div className="space-y-2">
                <Label htmlFor="difficulty-select">Nível de Dificuldade</Label>
                <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)} disabled={hasCompleted}>
                    <SelectTrigger id="difficulty-select">
                        <SelectValue placeholder="Selecione o nível..." />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(difficultyConfig).map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <p className="text-xs text-muted-foreground pt-1">
              Pontuação por acerto: 
              <span className="font-bold text-green-400 ml-1">
                Fácil: {difficultyConfig['Fácil']}pts | Médio: {difficultyConfig['Médio']}pts | Difícil: {difficultyConfig['Difícil']}pts
              </span>
            </p>
        </div>

        <Button onClick={handleStartQuiz} disabled={isLoading || hasCompleted} className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground font-semibold">
          {hasCompleted ? <><Trophy className="mr-2"/> Quiz do Dia Concluído</> : <><Sparkles className="mr-2" /> Iniciar Quiz</>}
        </Button>
        {hasCompleted && <p className="text-xs text-muted-foreground mt-2">Você já ganhou seus pontos neste desafio hoje.</p>}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" key={currentQuestionIndex}>
      <div className="flex justify-between items-center">
        <CardTitle className="text-xl">Quiz: {quiz.title}</CardTitle>
        <div className="text-sm font-medium text-muted-foreground">Pergunta {currentQuestionIndex + 1} de {quiz.questions.length}</div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">{currentQuestion.questionText}</h3>
        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => setSelectedAnswer(parseInt(value, 10))}
          disabled={showFeedback}
          className="mt-4 space-y-3"
        >
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswerIndex;
            const isSelected = index === selectedAnswer;

            let variant = '';
            if (showFeedback) {
              if (isCorrect) variant = 'border-green-500 bg-green-500/10 text-primary';
              else if (isSelected) variant = 'border-destructive bg-destructive/10';
            }

            return (
              <Label
                key={index}
                htmlFor={`option-${index}`}
                className={cn(
                  "flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  "hover:bg-accent/50",
                  variant
                )}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <span className="ml-4 text-base">{option}</span>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      {showFeedback && (
        <Card className={cn(
          "border-2",
          selectedAnswer === currentQuestion.correctAnswerIndex ? 'border-green-500' : 'border-destructive'
        )}>
          <CardHeader>
            <CardTitle className={cn(
              "text-lg",
              selectedAnswer === currentQuestion.correctAnswerIndex ? 'text-green-500' : 'text-destructive'
            )}>
              {selectedAnswer === currentQuestion.correctAnswerIndex ? 'Resposta Correta!' : 'Resposta Incorreta!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{currentQuestion.explanation}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        {showFeedback ? (
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
          </Button>
        ) : (
          <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null}>
            Confirmar Resposta
          </Button>
        )}
      </div>
    </div>
  );
}