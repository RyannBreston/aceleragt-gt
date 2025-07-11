'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "../layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PerfilPage() {
    const { toast } = useToast();
    const { sellers, setSellers, adminUser, setAdminUser } = useAdminContext();
    
    // State for seller management
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    const [sellerNickname, setSellerNickname] = useState('');
    const [sellerPassword, setSellerPassword] = useState('');
    
    const selectedSeller = sellers.find(s => s.id === selectedSellerId);

    useEffect(() => {
        if (selectedSeller) {
            setSellerNickname(selectedSeller.nickname || '');
            setSellerPassword(selectedSeller.password || '');
        } else {
            setSellerNickname('');
            setSellerPassword('');
        }
    }, [selectedSellerId, selectedSeller]);

    const handleSellerSelect = (sellerId: string) => {
        setSelectedSellerId(sellerId);
    };

    const handleSellerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSellerId) {
            toast({
                variant: 'destructive',
                title: 'Nenhum Vendedor Selecionado',
                description: 'Por favor, selecione um vendedor para atualizar.',
            });
            return;
        }

        setSellers(prevSellers => 
            prevSellers.map(seller => 
                seller.id === selectedSellerId 
                    ? { ...seller, nickname: sellerNickname, password: sellerPassword }
                    : seller
            )
        );

        toast({
            title: 'Perfil do Vendedor Atualizado!',
            description: `As informações de ${selectedSeller?.name} foram salvas com sucesso.`,
        });
    };

    // State for admin management
    const [adminNickname, setAdminNickname] = useState(adminUser.nickname);
    const [adminPassword, setAdminPassword] = useState(adminUser.password);
    const [adminEmail, setAdminEmail] = useState(adminUser.email || '');

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAdminUser(() => ({
            nickname: adminNickname,
            email: adminEmail,
            password: adminPassword,
        }));
        toast({
            title: 'Perfil de Administrador Atualizado!',
            description: 'Suas informações de acesso foram salvas com sucesso.',
        });
    };


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserCog className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Gerenciar Perfis</h1>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-6" />
                <span>Perfil do Administrador</span>
            </CardTitle>
            <CardDescription>Edite suas informações de acesso à plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleAdminSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="adminNickname">Login (Nickname)</Label>
                    <Input id="adminNickname" type="text" placeholder="Nickname do administrador" value={adminNickname} onChange={(e) => setAdminNickname(e.target.value)} className="bg-input" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email (Opcional)</Label>
                    <Input id="adminEmail" type="email" placeholder="seu@email.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-input" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adminPassword">Nova Senha</Label>
                    <Input id="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="bg-input" placeholder="Defina sua senha" required />
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Salvar Perfil de Admin</Button>
                </div>
            </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
            <CardTitle>Perfis de Vendedores</CardTitle>
            <CardDescription>Selecione um vendedor para editar seu login e senha.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSellerSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="seller-select">Selecionar Vendedor</Label>
                    <Select onValueChange={handleSellerSelect} value={selectedSellerId || ""}>
                        <SelectTrigger id="seller-select">
                            <SelectValue placeholder="Escolha um vendedor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {sellers.map(seller => (
                                <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {selectedSellerId && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="nickname">Login (Nickname)</Label>
                            <Input id="nickname" type="text" placeholder="Nickname do vendedor" value={sellerNickname} onChange={(e) => setSellerNickname(e.target.value)} className="bg-input" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input id="password" type="text" value={sellerPassword} onChange={(e) => setSellerPassword(e.target.value)} className="bg-input" placeholder="Defina a senha do vendedor" />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit">Salvar Perfil do Vendedor</Button>
                        </div>
                    </>
                )}
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
