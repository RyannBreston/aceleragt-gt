/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useAdminContext } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, Edit, KeyRound } from 'lucide-react';
import { Seller } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// ... (Sub-componentes SellerForm e ChangePasswordForm permanecem os mesmos)

export default function SellersPage() {
    const { sellers, isLoading, createSeller, updateSeller, deleteSeller, changeSellerPassword } = useAdminContext();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    const handleOpenDialog = (seller?: Seller | null) => {
        setSelectedSeller(seller || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedSeller(null);
    };

    const handleSave = async (data: any, isCreating: boolean) => {
        try {
            if (isCreating) {
                await createSeller(data);
            } else {
                const fullSellerData = { ...selectedSeller, ...data };
                await updateSeller(fullSellerData as Seller);
            }
            handleCloseDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro!', description: error.message });
        }
    };
    
    // ... (resto da lógica e JSX da página completa, como fornecido anteriormente)
    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerir Vendedores</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Vendedor
                        </Button>
                    </DialogTrigger>
                    {/* ... (Conteúdo do Dialog) */}
                </Dialog>
            </div>
            {/* ... (Tabela de Vendedores) */}
        </div>
    );
}