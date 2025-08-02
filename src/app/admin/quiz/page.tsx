'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Puzzle, Trophy, Users, BarChart } from "lucide-react";
import { useAdminContext } from '@/contexts/AdminContext'; // ✅ IMPORTAÇÃO CORRETA
import type { Course, Seller } from '@/lib/types';

// Supondo que você tenha um hook ou forma de buscar os cursos
// Se não tiver, pode adaptar o useEffect da página de academia
const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    // Lógica para buscar cursos aqui...
    return { courses, isLoading: false };
}


export default function AdminQuizPage() {
    const { sellers } = useAdminContext();
    const { courses, isLoading: isLoadingCourses } = useCourses();
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId);
    }, [courses, selectedCourseId]);

    const quizStats = useMemo(() => {
        if (!selectedCourse || !selectedCourse.quiz) {
            return { totalQuestions: 0, averageScore: 0, completionRate: 0 };
        }
        // Lógica para calcular as estatísticas do quiz (pode ser implementada depois)
        return {
            totalQuestions: selectedCourse.quiz.length,
            averageScore: 0, // Calcular média de acertos dos vendedores
            completionRate: 0, // Calcular % de vendedores que completaram
        };
    }, [selectedCourse, sellers]);

    if (isLoadingCourses) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Puzzle className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Análise de Quizzes</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Selecione um Curso para Análise</CardTitle>
                    <CardDescription>Veja o desempenho dos vendedores nos quizzes de cada curso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="Escolha um curso..." />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id!}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCourse && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados para: {selectedCourse.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <BarChart className="size-10 text-primary" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Total de Perguntas</p>
                                <p className="text-2xl font-semibold">{quizStats.totalQuestions}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <Trophy className="size-10 text-yellow-500" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Média de Acertos</p>
                                <p className="text-2xl font-semibold">{quizStats.averageScore.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <Users className="size-10 text-green-500" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Taxa de Conclusão</p>
                                <p className="text-2xl font-semibold">{quizStats.completionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                        {/* Aqui você pode adicionar uma tabela com os resultados de cada vendedor */}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}