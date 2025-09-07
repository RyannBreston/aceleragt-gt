'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function AcademiaPage() {
  // A lógica para esta página será desenvolvida com a nova arquitetura
  // usando o AdminContext e chamadas à API, se necessário.
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Academia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2" />
            Gestão de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            A funcionalidade de gestão da academia será implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}