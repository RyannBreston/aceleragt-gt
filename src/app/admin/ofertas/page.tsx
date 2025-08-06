'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Edit, Trash2, PlusCircle, Save, Image as ImageIcon, Calendar as CalendarIcon } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import type { Offer } from '@/lib/types';

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// ✅ IMPORTAÇÃO CORRIGIDA AQUI: Adicionado DialogFooter
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OFFER_CATEGORIES = ['Calçados', 'Roupas', 'Acessórios', 'Eletrônicos', 'Esportes', 'Outros'];

// ####################################################################
// ### 1. SUB-COMPONENTE: MODAL DO FORMULÁRIO ###
// ####################################################################
const OfferFormModal = ({ isOpen, setIsOpen, offer, onSave }: { isOpen: boolean; setIsOpen: (open: boolean) => void; offer: Partial<Offer> | null; onSave: (offerData: Partial<Offer>, imageFile: File | null) => Promise<void> }) => {
    const [formData, setFormData] = useState<Partial<Offer>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const initialOfferState: Partial<Offer> = {
            name: '', description: '', imageUrl: '', originalPrice: undefined, promotionalPrice: 0,
            startDate: new Date(), expirationDate: new Date(), isActive: true, category: '',
            productCode: '', reference: '', isFlashOffer: false, isBestSeller: false,
        };
        setFormData(offer || initialOfferState);
        setImageFile(null);
    }, [offer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value.replace(',', '.') || '0');
        setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? undefined : numericValue }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast({ variant: 'destructive', title: 'Imagem muito grande!' });
                return;
            }
            setImageFile(file);
            setFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.promotionalPrice || !formData.category) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios' });
            return;
        }
        setIsSubmitting(true);
        await onSave(formData, imageFile);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{formData.id ? 'Editar Oferta' : 'Adicionar Nova Oferta'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nome do Produto</Label><Input name="name" value={formData.name || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label>Categoria</Label><Select value={formData.category || ''} onValueChange={(v) => setFormData(p => ({...p, category: v}))}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{OFFER_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="space-y-2"><Label>Descrição</Label><Textarea name="description" value={formData.description || ''} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Upload de Imagem (Max 5MB)</Label><Input type="file" accept="image/*" onChange={handleFileChange} /></div>
                    <div className="space-y-2"><Label>Ou cole a URL da Imagem</Label><Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} disabled={!!imageFile} /></div>
                    {formData.imageUrl && <div className="flex justify-center"><img src={formData.imageUrl} alt="Pré-visualização" className="w-32 h-32 object-cover rounded-md border"/></div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Valor Original (R$)</Label><Input name="originalPrice" type="text" value={formData.originalPrice || ''} onChange={handlePriceChange} /></div>
                        <div className="space-y-2"><Label>Preço Promocional (R$)</Label><Input name="promotionalPrice" type="text" value={formData.promotionalPrice || ''} onChange={handlePriceChange} required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Data de Início</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{formData.startDate ? format(formData.startDate, "PPP", { locale: ptBR }) : ''}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.startDate} onSelect={(d) => setFormData(p => ({...p, startDate: d || new Date()}))} /></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>Data de Expiração</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{formData.expirationDate ? format(formData.expirationDate, "PPP", { locale: ptBR }) : ''}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.expirationDate} onSelect={(d) => setFormData(p => ({...p, expirationDate: d || new Date()}))} /></PopoverContent></Popover></div>
                    </div>
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center space-x-3"><Switch id="isActive" checked={formData.isActive} onCheckedChange={(c) => setFormData(p => ({...p, isActive: c}))} /><Label htmlFor="isActive">Oferta Ativa</Label></div>
                        <div className="flex items-center space-x-3"><Checkbox id="isFlashOffer" checked={formData.isFlashOffer} onCheckedChange={(c) => setFormData(p => ({...p, isFlashOffer: !!c}))} /><Label htmlFor="isFlashOffer">Oferta Relâmpago</Label></div>
                        <div className="flex items-center space-x-3"><Checkbox id="isBestSeller" checked={formData.isBestSeller} onCheckedChange={(c) => setFormData(p => ({...p, isBestSeller: !!c}))} /><Label htmlFor="isBestSeller">Mais Vendido</Label></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ####################################################################
// ### 2. COMPONENTE PRINCIPAL DA PÁGINA ###
// ####################################################################
export default function AdminOffersPage() {
    const { toast } = useToast();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState<Partial<Offer> | null>(null);
    const offersCollectionPath = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/offers`;

    useEffect(() => {
        const offersQuery = query(collection(db, offersCollectionPath), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
            const offersList = snapshot.docs.map(d => ({
                id: d.id, ...d.data(),
                startDate: d.data().startDate?.toDate(),
                expirationDate: d.data().expirationDate?.toDate(),
            } as Offer));
            setOffers(offersList);
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, [offersCollectionPath]);

    const openModal = (offer?: Offer) => {
        setCurrentOffer(offer || null);
        setIsModalOpen(true);
    };

    const handleSaveOffer = async (offerData: Partial<Offer>, imageFile: File | null) => {
        let finalImageUrl = offerData.imageUrl || '';
        try {
            if (imageFile) {
                const storageRef = ref(storage, `offers/${Date.now()}-${imageFile.name}`);
                const uploadTask = await uploadBytes(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(uploadTask.ref);
            }
            const dataToSave = { ...offerData, imageUrl: finalImageUrl, updatedAt: serverTimestamp() };

            if (offerData.id) {
                await updateDoc(doc(db, offersCollectionPath, offerData.id), dataToSave);
                toast({ title: 'Oferta Atualizada!' });
            } else {
                await addDoc(collection(db, offersCollectionPath), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Oferta Adicionada!' });
            }
            setIsModalOpen(false);
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Falha ao Salvar', description: err.message });
        }
    };

    const handleDeleteOffer = async (offerId: string) => {
        try {
            await deleteDoc(doc(db, offersCollectionPath, offerId));
            toast({ title: 'Oferta Excluída!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Excluir' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <ShoppingBag className="size-8 text-primary" />
                    <h1 className="text-3xl font-bold">Gestão de Ofertas</h1>
                </div>
                <Button onClick={() => openModal()}><PlusCircle className="mr-2" /> Adicionar Oferta</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ofertas Atuais</CardTitle>
                    <CardDescription>Lista de todas as promoções criadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Preço Promocional</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : offers.length > 0 ? offers.map(offer => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium flex items-center gap-4">
                                            <img src={offer.imageUrl || 'https://placehold.co/60x60/27272a/FFF?text=Oferta'} alt={offer.name} className="w-12 h-12 object-cover rounded-md bg-muted" />
                                            <div>
                                                <p>{offer.name}</p>
                                                <p className="text-xs text-muted-foreground">{offer.category}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">{`R$ ${offer.promotionalPrice.toFixed(2)}`}</TableCell>
                                        <TableCell>
                                            <Badge variant={offer.isActive ? "default" : "outline"}>
                                                {offer.isActive ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(offer)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação irá remover a oferta "{offer.name}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOffer(offer.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <p className="font-semibold">Nenhuma oferta criada.</p>
                                            <p className="text-sm text-muted-foreground">Clique em "Adicionar Oferta" para começar.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <OfferFormModal 
                isOpen={isModalOpen} 
                setIsOpen={setIsModalOpen} 
                offer={currentOffer}
                onSave={handleSaveOffer}
            />
        </div>
    );
}