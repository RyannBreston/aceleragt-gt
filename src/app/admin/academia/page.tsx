'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

// This will eventually list all the courses
export default function AdminAcademiaPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Academia</h1>
                <Button asChild>
                    <Link href="/admin/academia/novo">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Novo Curso
                    </Link>
                </Button>
            </div>
            <p>Em breve: uma lista de todos os cursos para gerir.</p>
        </div>
    );
}