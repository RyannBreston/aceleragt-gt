'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AcademiaPage() {
  const courses = React.useMemo(() => [
    { id: 'course1', title: 'Introdução às Vendas', description: 'Aprenda os fundamentos...', imageUrl: '' },
    { id: 'course2', title: 'Técnicas Avançadas', description: 'Aprofunde-se em estratégias...', imageUrl: '' },
    { id: 'course3', title: 'Gestão de Tempo', description: 'Otimize seu dia...', imageUrl: '' }
  ], []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Academia</h1>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <Button variant="outline" className="mt-4">Acessar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}