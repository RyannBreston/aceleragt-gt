'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookCopy, Trash2, GraduationCap, FileText, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course } from '@/lib/types';
import { useAdminContext } from '@/contexts/AdminContext';
import { db } from '@/lib/firebase';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Certificate } from '@/components/Certificate';

// --- Sub-componente: Pré-visualização do Certificado ---
const CertificatePreview = ({ course }: { course: Course }) => {
    const { sellers } = useAdminContext();
    const [selectedSellerId, setSelectedSellerId] = useState<string>('');
    const selectedSeller = useMemo(() => sellers.find(s => s.id === selectedSellerId), [sellers, selectedSellerId]);
    const sellerNameForCertificate = selectedSeller?.name || "Nome do Vendedor (Exemplo)";
    const verificationCode = `ACGT-DEMO-${course.id?.substring(0, 4) || '0000'}`;
    const qrCodeValue = `https://apps-das-supermoda.netlify.app/verify?code=${verificationCode}`;

    return (
        <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0">
            <DialogHeader className="sr-only"><DialogTitle>Certificado: {course.title}</DialogTitle></DialogHeader>
            <div className="absolute top-4 left-4 z-20 w-64">
                <Label className="text-white font-semibold text-shadow">Pré-visualizar para:</Label>
                <Select onValueChange={setSelectedSellerId}>
                    <SelectTrigger className="bg-white/90"><SelectValue placeholder="Selecione um vendedor..." /></SelectTrigger>
                    <SelectContent>{sellers.map(seller => (<SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <Certificate courseTitle={course.title} sellerName={sellerNameForCertificate} verificationCode={verificationCode} qrCodeValue={qrCodeValue} performanceLevel="gold" achievements={["Competência Chave"]} />
        </DialogContent>
    );
};

// --- Componente Principal da Página ---
export default function AcademiaPage() {
    const { sellers } = useAdminContext();
    const { toast } = useToast();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 6;
    
    const coursesCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/courses`;

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, coursesCollectionPath), (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
            setLoadingCourses(false);
        }, () => setLoadingCourses(false));
        return () => unsubscribe();
    }, [coursesCollectionPath]);
    
    const { filteredCourses, totalPages } = useMemo(() => {
        const filtered = courses.filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase()));
        return {
            filteredCourses: filtered,
            totalPages: Math.ceil(filtered.length / coursesPerPage)
        };
    }, [courses, searchTerm]);

    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * coursesPerPage;
        return filteredCourses.slice(startIndex, startIndex + coursesPerPage);
    }, [filteredCourses, currentPage]);
    
    const courseCompletions = useMemo(() => {
        const completions = new Map<string, number>();
        courses.forEach(course => {
            completions.set(course.id!, sellers.filter(s => s.completedCourseIds?.includes(course.id!)).length);
        });
        return completions;
    }, [courses, sellers]);

    const handleDeleteCourse = async (courseId: string) => {
        try {
            await deleteDoc(doc(db, coursesCollectionPath, courseId));
            toast({ title: 'Curso excluído.' });
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao Excluir' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <GraduationCap className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Academia de Vendas</h1>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Cursos Criados ({filteredCourses.length})</h3>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Buscar curso..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
                    </div>
                </div>
                {loadingCourses ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : paginatedCourses.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedCourses.map(course => (
                                <Card key={course.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="truncate">{course.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 text-xs"><Users className="size-3" /><span>{courseCompletions.get(course.id!) || 0} / {sellers.length} concluíram</span></CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow"><p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p></CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="flex-1"><FileText className="mr-2 size-4" /> Certificado</Button></DialogTrigger><CertificatePreview course={course} /></Dialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita e irá remover o curso permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteCourse(course.id!)}>Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="size-4" /></Button>
                                <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
                                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="size-4" /></Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <BookCopy className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">{searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso criado'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}