/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

// ... (Sub-componentes SellerForm e ChangePasswordForm permanecem os mesmos)

export default function SellersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenDialog = () => {
        setIsDialogOpen(true);
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
                    {/* <SellerForm seller={selectedSeller} onSave={handleSave} onCancel={handleCloseDialog} /> */}
                </Dialog>
            </div>
            {/* ... (Tabela de Vendedores) */}
        </div>
    );
}