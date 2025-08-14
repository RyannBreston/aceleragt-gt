'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Save, GraduationCap, MoreVertical, Pencil, Trash2, Upload, File as FileIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Course, CourseDifficulty } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// --- Tipos e Constantes ---
const ARTIFACTS_PATH = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data`;
const COURSE_COLLECTION = `${ARTIFACTS_PATH}/courses`;
const PDF_STORAGE_PATH = 'course-pdfs';

// --- Componente do Formulário (Modal) ---
const CourseForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Partial<Course>;
  onSave: (data: Omit<Course, 'id'>, id?: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<Course, 'id'>>({
    title: initialData.title || '',
    content: initialData.content || '',
    points: initialData.points || 100,
    dificuldade: initialData.dificuldade || 'Fácil',
    quiz: initialData.quiz || [],
    pdfUrl: initialData.pdfUrl,
    pdfFileName: initialData.pdfFileName,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof Omit<Course, 'id'>, value: string | number | CourseDifficulty | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    handleInputChange('pdfUrl', undefined);
    handleInputChange('pdfFileName', undefined);
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Título e Conteúdo são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);
    
    const finalData = { ...formData };

    if (pdfFile) {
      const storageRef = ref(storage, `${PDF_STORAGE_PATH}/${Date.now()}_${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      const downloadURL = await getDownloadURL(storageRef);
      finalData.pdfUrl = downloadURL;
      finalData.pdfFileName = pdfFile.name;
    }

    if (!finalData.pdfUrl && initialData.pdfUrl) {
        const oldFileRef = ref(storage, initialData.pdfUrl);
        try { await deleteObject(oldFileRef); } catch (error) { console.warn("Old PDF not found, skipping deletion:", error); }
    }

    await onSave(finalData, initialData.id);
    setIsSubmitting(false);
  };

  return (
    <>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialData.id ? 'Editar Curso' : 'Criar Novo Curso'}</DialogTitle>
          <DialogDescription>Preencha os detalhes do curso e anexe um PDF se necessário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-grow overflow-y-auto pr-4">
          <div><Label htmlFor="course-title">Título</Label><Input id="course-title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} /></div>
          <div><Label htmlFor="course-content">Conteúdo</Label><Textarea id="course-content" value={formData.content} onChange={e => handleInputChange('content', e.target.value)} rows={5} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="course-points">Pontos</Label><Input id="course-points" type="number" value={formData.points} onChange={e => handleInputChange('points', Number(e.target.value))} /></div>
            <div>
              <Label htmlFor="course-difficulty">Dificuldade</Label>
              <Select value={formData.dificuldade} onValueChange={(value: CourseDifficulty) => handleInputChange('dificuldade', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Fácil">Fácil</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Difícil">Difícil</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Anexo PDF</Label>
            {formData.pdfUrl || pdfFile ? (
                 <div className="mt-2 flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2 truncate">
                        <FileIcon className="size-5 text-primary"/>
                        <span className="text-sm truncate">{pdfFile?.name || formData.pdfFileName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removePdf}><X className="size-4"/></Button>
                 </div>
            ) : (
                <div className="mt-2 flex items-center justify-center w-full">
                    <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                            <p className="text-xs text-muted-foreground">Apenas arquivos PDF</p>
                        </div>
                        <Input id="pdf-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    </label>
                </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
};

// --- Componente do Card de Visualização ---
const CourseCard = ({ course, onEdit, onDelete }: { course: Course; onEdit: (course: Course) => void; onDelete: (id: string, pdfUrl?: string) => void; }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex justify-between items-start">
        <span>{course.title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(course)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(course.id!, course.pdfUrl)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardTitle>
      <CardDescription>{course.dificuldade} - {course.points} pts</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p>
    </CardContent>
    {course.pdfUrl && (
        <CardFooter className="bg-muted/40 p-3">
             <div className="flex items-center gap-2 text-sm">
                <FileIcon className="size-4 text-primary"/>
                <span className="font-semibold truncate">{course.pdfFileName || 'Documento PDF'}</span>
            </div>
        </CardFooter>
    )}
  </Card>
);

// --- Componente Principal da Página ---
export default function AdminAcademiaPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseToEdit, setCourseToEdit] = useState<Partial<Course> | null>(null);
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

  const handleSave = async (data: Omit<Course, 'id'>, id?: string) => {
    try {
      if (id) {
        await updateDoc(doc(db, COURSE_COLLECTION, id), data);
      } else {
        await addDoc(collection(db, COURSE_COLLECTION), data);
      }
      toast({ title: 'Sucesso!', description: `Curso ${id ? 'atualizado' : 'criado'}.` });
      setCourseToEdit(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: String(error) });
    }
  };

  const handleDelete = async (id: string, pdfUrl?: string) => {
    try {
      if (pdfUrl) {
          const fileRef = ref(storage, pdfUrl);
          await deleteObject(fileRef);
      }
      await deleteDoc(doc(db, COURSE_COLLECTION, id));
      toast({ title: 'Sucesso!', description: 'Curso excluído.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: String(error) });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4"><GraduationCap className="size-8 text-primary" /><h1 className="text-3xl font-bold">Academia</h1></div>
        <Button onClick={() => setCourseToEdit({})}><PlusCircle className="mr-2 size-4" /> Criar Curso</Button>
      </div>
      
      {isLoading && <div className="text-center p-6"><Loader2 className="mx-auto animate-spin text-primary" /></div>}
      
      {!isLoading && courses.length === 0 && <EmptyState Icon={GraduationCap} title="Nenhum Curso Criado" description="Crie o seu primeiro curso para treinar a sua equipa."/>}
      
      {!isLoading && courses.length > 0 &&
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} onEdit={setCourseToEdit} onDelete={handleDelete} />
          ))}
        </div>
      }

      <Dialog open={!!courseToEdit} onOpenChange={(isOpen) => !isOpen && setCourseToEdit(null)}>
        {courseToEdit && <CourseForm initialData={courseToEdit} onSave={handleSave} onCancel={() => setCourseToEdit(null)} />}
      </Dialog>
    </div>
  );
}
