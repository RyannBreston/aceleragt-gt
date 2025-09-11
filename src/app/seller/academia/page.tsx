/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSellerContext } from '@/contexts/SellerContext';
import { Loader2 } from 'lucide-react';
import CourseCard, { Course } from '@/components/CourseCard';

export default function AcademiaPage() {
  const courses: Course[] = React.useMemo(() => [
    { id: 'c1', title: 'Boas-vindas e Introdução', description: 'Conheça a plataforma e seus recursos.', imageUrl: '/images/courses/intro.jpg' },
    { id: 'c2', title: 'Vendas Consultivas', description: 'Aprenda a vender focando nas necessidades do cliente.', imageUrl: '/images/courses/consultivas.jpg' },
    { id: 'c3', title: 'Estratégias de Fidelização', description: 'Técnicas para manter clientes satisfeitos.', imageUrl: '/images/courses/fidelizacao.jpg' },
  ], []);
  const { isLoading } = useSellerContext();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Academia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Cursos e Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} onAccess={(id) => console.log('Access course', id)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}