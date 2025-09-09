'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';

export default function AcademiaPage() {
  const { isLoading } = useAdminContext();

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
            <BookOpen className="mr-2" />
            Cursos e Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            A funcionalidade da academia será implementada aqui na nova arquitetura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}