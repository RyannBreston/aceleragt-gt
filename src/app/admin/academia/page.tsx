'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, BookCopy, Trash2, GraduationCap, PlusCircle, Edit, FileText, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course } from '@/lib/types';
import { useAdminContext } from '@/contexts/AdminContext';
import { db } from '@/lib/firebase';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Certificate } from '@/components/Certificate';
import { CourseEditorModal } from '@/components/CourseEditorModal';

// --- Dados para os Seletores ---
const BRANDS = ['Olympikus', 'Beira Rio', 'Moleca', 'Vizzano', 'Mizuno', 'Dakota', 'Mississipi', 'Outra'];
const PRODUCT_TYPES = ['Tênis', 'Sandália', 'Sapatilha', 'Bota', 'Chinelo', 'Scarpin', 'Mule', 'Outro'];

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

// --- Sub-componente: Criador de Cursos ---
const CourseCreator = ({ onCourseGenerated }: { onCourseGenerated: (course: Partial<Course>) => void }) => {
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedProductType, setSelectedProductType] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerateCourse = async () => {
        const topic = customTopic || `${selectedProductType} da marca ${selectedBrand}`;
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'Tópico necessário', description: 'Selecione uma opção ou descreva um tópico.' });
            return;
        }
        setIsGenerating(true);
        try {
            // ✅ USA 'FETCH' PARA CHAMAR A ROTA DE API
            const response = await fetch('/api/generateCourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                throw new Error('A resposta da rede não foi OK');
            }

            const result = await response.json();
            
            onCourseGenerated(result as Course);
            toast({ title: "Curso gerado pela IA!", description: "Revise e salve o conteúdo gerado." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Falha ao Gerar Curso', description: 'Ocorreu um erro ao comunicar com a IA.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-xl">Criador de Cursos</CardTitle><CardDescription>Gere cursos com IA ou crie um do zero.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Marca</Label><Select onValueChange={setSelectedBrand}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Tipo de Calçado</Label><Select onValueChange={setSelectedProductType}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div></div>
                <div className="space-y-2"><Label>Tópico Customizado</Label><Input placeholder="Ex: Técnicas de venda para botas de inverno" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} /></div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button onClick={handleGenerateCourse} disabled={isGenerating} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Gerar com IA</Button>
                    <Button onClick={() => onCourseGenerated({})} variant="secondary" className="flex-1"><PlusCircle className="mr-2 h-4 w-4" /> Criar Manualmente</Button>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Componente Principal da Página ---
export default function AcademiaPage() {
    const { sellers } = useAdminContext();
    const { toast } = useToast();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
    }, [courses, searchTerm, coursesPerPage]);

    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * coursesPerPage;
        return filteredCourses.slice(startIndex, startIndex + coursesPerPage);
    }, [filteredCourses, currentPage, coursesPerPage]);
    
    const courseCompletions = useMemo(() => {
        const completions = new Map<string, number>();
        courses.forEach(course => {
            completions.set(course.id!, sellers.filter(s => s.completedCourseIds?.includes(course.id!)).length);
        });
        return completions;
    }, [courses, sellers]);
    
    const openCourseModal = (course?: Partial<Course>) => {
        setCurrentCourse(course || { title: '', content: '', quiz: [], points: 100, dificuldade: 'Médio' });
        setIsModalOpen(true);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este curso?')) {
            try {
                await deleteDoc(doc(db, coursesCollectionPath, courseId));
                toast({ title: 'Curso excluído.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao Excluir' });
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <GraduationCap className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Academia de Vendas</h1>
            </div>

            <CourseCreator onCourseGenerated={openCourseModal} />

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
                                        <Button onClick={() => openCourseModal(course)} size="sm" className="flex-1"><Edit className="mr-2 size-4" /> Editar</Button>
                                        <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><FileText className="mr-2 size-4" /> Certificado</Button></DialogTrigger><CertificatePreview course={course} /></Dialog>
                                        <Button onClick={() => handleDeleteCourse(course.id!)} variant="destructive" size="icon"><Trash2 className="size-4" /></Button>
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

            {currentCourse && <CourseEditorModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} course={currentCourse} collectionPath={coursesCollectionPath} />}
        </div>
    );
}