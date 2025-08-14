'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { GraduationCap, Download, Eye, CheckCircle2 } from "lucide-react";
import { useSellerContext } from '@/contexts/SellerContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import type { Course } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/client-utils';

// --- Constantes ---
const ARTIFACTS_PATH = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data`;
const COURSE_COLLECTION = `${ARTIFACTS_PATH}/courses`;

// --- Componente do Card do Curso ---
const CourseCard = ({ course, completedCourseIds }: { course: Course; completedCourseIds: string[] }) => {
  const isCompleted = course.id ? completedCourseIds.includes(course.id) : false;

  return (
    <Card className={cn("flex flex-col", isCompleted && "bg-muted/50")}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle>{course.title}</CardTitle>
            {isCompleted && <CheckCircle2 className="size-6 text-green-500" />}
        </div>
        <CardDescription>{course.dificuldade} - {course.points} pts</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-4">{course.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {course.pdfUrl && (
          <div className="w-full space-y-2">
             <p className="text-sm font-semibold">Material de Apoio</p>
             <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button asChild variant="secondary" className="w-full">
                    <Link href={course.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 size-4" /> Visualizar PDF
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <a href={course.pdfUrl} download={course.pdfFileName || 'material.pdf'}>
                        <Download className="mr-2 size-4" /> Baixar PDF
                    </a>
                </Button>
             </div>
          </div>
        )}
        <Button className="w-full" disabled={isCompleted}>
            {isCompleted ? 'Curso Concluído' : 'Iniciar Curso'}
        </Button>
      </CardFooter>
    </Card>
  );
};


// --- Página Principal ---
export default function SellerAcademiaPage() {
    const { currentSeller, isAuthReady } = useSellerContext();
    const { toast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, COURSE_COLLECTION), orderBy('title', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(coursesFromDb);
            setIsLoading(false);
        }, (error) => {
            toast({ variant: 'destructive', title: 'Erro ao carregar cursos', description: String(error) });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);

    if (!isAuthReady || isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <GraduationCap className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Academia</h1>
            </div>

            {courses.length === 0 ? (
                <EmptyState 
                    Icon={GraduationCap}
                    title="Nenhum Curso Disponível"
                    description="Ainda não há cursos disponíveis. Volte mais tarde!"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <CourseCard 
                            key={course.id} 
                            course={course} 
                            completedCourseIds={currentSeller?.completedCourseIds || []}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
