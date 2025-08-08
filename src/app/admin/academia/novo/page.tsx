'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// This will be the form to create a new course
export default function NewCoursePage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Criar Novo Curso</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Detalhes do Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label htmlFor="title">Título do Curso</label>
                        <Input id="title" placeholder="Ex: Técnicas Avançadas de Venda" />
                    </div>
                    <div>
                        <label htmlFor="description">Descrição</label>
                        <Textarea id="description" placeholder="Descreva o que os vendedores aprenderão neste curso." />
                    </div>
                    <Button>Salvar Curso</Button>
                </CardContent>
            </Card>
        </div>
    );
}