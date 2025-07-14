'use client';

import * as React from 'react';
import { ShoppingBag, Loader2, Edit, Trash2, Calendar as CalendarIcon, PlusCircle, Save } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { useAdminContext } from '@/contexts/AdminContext'; // Caminho de importação corrigido
import { Offer } from '@/lib/types';

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from '@/components/ui/checkbox';

// Utilidades
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OFFER_CATEGORIES = ['Calçados', 'Roupas', 'Acessórios', 'Eletrônicos', 'Esportes', 'Outros'];

export default function AdminOffersPage() {
  const { toast } = useToast();
  const { isAuthReady } = useAdminContext();
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const offersCollectionPath = `artifacts/${appId}/public/data/offers`;

  const initialOfferState: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    description: '',
    imageUrl: '',
    originalPrice: undefined,
    promotionalPrice: 0,
    startDate: new Date(),
    expirationDate: new Date(),
    isActive: true,
    category: '',
    productCode: '',
    reference: '',
    isFlashOffer: false,
    isBestSeller: false,
  };

  const [currentOffer, setCurrentOffer] = React.useState(initialOfferState);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editOfferId, setEditOfferId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthReady) return;

    const offersCollectionRef = collection(db, offersCollectionPath);
    const unsubscribe = onSnapshot(offersCollectionRef, (snapshot) => {
      const offersList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        startDate: d.data().startDate?.toDate(),
        expirationDate: d.data().expirationDate?.toDate(),
      } as Offer));
      setOffers(offersList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoadingOffers(false);
    }, (error) => {
      console.error("Erro ao carregar ofertas:", error);
      toast({ variant: 'destructive', title: 'Erro ao Carregar Ofertas', description: error.message });
      setLoadingOffers(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, offersCollectionPath, toast]);

  const resetForm = () => {
    setCurrentOffer(initialOfferState);
    setImageFile(null);
    setIsEditing(false);
    setEditOfferId(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'Selecione uma imagem com menos de 5MB.' });
        return;
      }
      setImageFile(file);
      setCurrentOffer(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentOffer(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value.replace(',', '.') || '0');
    setCurrentOffer(prev => ({ ...prev, [name]: isNaN(numericValue) ? undefined : numericValue }));
  };

  const handleEditClick = (offer: Offer) => {
    resetForm();
    setCurrentOffer({
      ...offer,
      startDate: offer.startDate,
      expirationDate: offer.expirationDate,
    });
    setIsEditing(true);
    setEditOfferId(offer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOffer = async () => {
    if (!currentOffer.name || !currentOffer.promotionalPrice || !currentOffer.startDate || !currentOffer.expirationDate || !currentOffer.category) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Preencha nome, preço promocional, datas e categoria.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalImageUrl = currentOffer.imageUrl;

      if (imageFile) {
        setIsUploading(true);
        const storageRef = ref(storage, `offers/${Date.now()}-${imageFile.name}`);
        const uploadTask = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(uploadTask.ref);
        setIsUploading(false);
      }

      const offerDataToSave = {
        ...currentOffer,
        imageUrl: finalImageUrl,
        startDate: new Date(currentOffer.startDate),
        expirationDate: new Date(currentOffer.expirationDate),
        updatedAt: serverTimestamp(),
      };

      const offersCollectionRef = collection(db, offersCollectionPath);
      if (isEditing && editOfferId) {
        await updateDoc(doc(offersCollectionRef, editOfferId), offerDataToSave as any);
        toast({ title: 'Oferta Atualizada!' });
      } else {
        await addDoc(offersCollectionRef, { ...offerDataToSave, createdAt: serverTimestamp() } as any);
        toast({ title: 'Oferta Adicionada!' });
      }

      resetForm();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: err.message });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string, offerName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a oferta "${offerName}"?`)) {
        await deleteDoc(doc(db, offersCollectionPath, offerId));
        toast({ title: 'Oferta Excluída!' });
    }
  };


  if (loadingOffers) return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-background">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
            <ShoppingBag className="size-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Ofertas</h1>
            <p className="text-muted-foreground">Crie e administre as promoções da sua loja</p>
        </div>
      </div>

      <Card className="shadow-sm border border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">{isEditing ? 'Editar Oferta' : 'Criar Nova Oferta'}</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para configurar a promoção.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveOffer(); }} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2"><Label htmlFor="name">Nome do Produto</Label><Input id="name" name="name" value={currentOffer.name || ''} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="category">Categoria</Label><Select value={currentOffer.category || ''} onValueChange={(value) => setCurrentOffer(prev => ({...prev, category: value}))}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{OFFER_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label htmlFor="productCode">Código do Produto (SKU)</Label><Input id="productCode" name="productCode" value={currentOffer.productCode || ''} onChange={handleInputChange} placeholder="Ex: SKU12345" /></div>
                <div className="grid gap-2"><Label htmlFor="reference">Referência</Label><Input id="reference" name="reference" value={currentOffer.reference || ''} onChange={handleInputChange} placeholder="Ex: REF-001-B" /></div>
            </div>

            <div className="grid gap-2"><Label htmlFor="description">Descrição (Opcional)</Label><Textarea id="description" name="description" value={currentOffer.description || ''} onChange={handleInputChange} /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="grid gap-2">
                    <Label htmlFor="imageUpload">Upload de Imagem</Label>
                    <Input id="imageUpload" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} disabled={isSubmitting} className="file:text-primary file:font-semibold" />
                    <p className="text-sm text-muted-foreground">Ou cole a URL no campo ao lado.</p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="imageUrl">URL da Imagem</Label>
                    <Input id="imageUrl" name="imageUrl" value={currentOffer.imageUrl || ''} onChange={handleInputChange} placeholder="https://exemplo.com/imagem.jpg" disabled={isSubmitting || !!imageFile} />
                </div>
            </div>

            {currentOffer.imageUrl && (
              <div className="mt-2"><Label>Pré-visualização</Label><div className="mt-2 w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted">{isUploading ? <Loader2 className="animate-spin text-primary" /> : <img src={currentOffer.imageUrl} alt="Pré-visualização" className="object-cover w-full h-full" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none';}} />}</div></div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label htmlFor="startDate">Data de Início</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}><CalendarIcon className="mr-2 h-4 w-4" />{currentOffer.startDate ? format(currentOffer.startDate, "PPP", { locale: ptBR }) : ''}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentOffer.startDate} onSelect={(date) => setCurrentOffer(prev => ({ ...prev, startDate: date || new Date() }))} initialFocus /></PopoverContent></Popover></div>
                <div className="grid gap-2"><Label htmlFor="expirationDate">Data de Expiração</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}><CalendarIcon className="mr-2 h-4 w-4" />{currentOffer.expirationDate ? format(currentOffer.expirationDate, "PPP", { locale: ptBR }) : ''}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentOffer.expirationDate} onSelect={(date) => setCurrentOffer(prev => ({ ...prev, expirationDate: date || new Date() }))} initialFocus /></PopoverContent></Popover></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2"><Label htmlFor="originalPrice">Valor Original (R$)</Label><Input id="originalPrice" name="originalPrice" type="text" value={currentOffer.originalPrice || ''} onChange={handlePriceChange} placeholder="De: 199,99" /></div>
              <div className="grid gap-2"><Label htmlFor="promotionalPrice">Preço Promocional (R$)</Label><Input id="promotionalPrice" name="promotionalPrice" type="text" value={currentOffer.promotionalPrice || ''} onChange={handlePriceChange} placeholder="Por: 99,99" required /></div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3"><Switch id="isActive" checked={currentOffer.isActive} onCheckedChange={(checked) => setCurrentOffer(prev => ({...prev, isActive: checked}))} /><Label htmlFor="isActive" className="cursor-pointer">Oferta Ativa</Label></div>
                <div className="flex items-center space-x-3"><Checkbox id="isFlashOffer" checked={currentOffer.isFlashOffer} onCheckedChange={(checked) => setCurrentOffer(prev => ({...prev, isFlashOffer: !!checked}))} /><Label htmlFor="isFlashOffer" className="cursor-pointer">Marcar como Oferta Relâmpago</Label></div>
                <div className="flex items-center space-x-3"><Checkbox id="isBestSeller" checked={currentOffer.isBestSeller} onCheckedChange={(checked) => setCurrentOffer(prev => ({...prev, isBestSeller: !!checked}))} /><Label htmlFor="isBestSeller" className="cursor-pointer">Marcar como Mais Vendido</Label></div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button type="submit" disabled={isSubmitting} className="flex-1 font-semibold text-lg py-6 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]">
                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</> : (isEditing ? 'Salvar Alterações' : 'Adicionar Oferta')}
              </Button>
              {isEditing && (<Button type="button" variant="outline" onClick={resetForm} className="flex-1 text-lg py-6">Cancelar Edição</Button>)}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}