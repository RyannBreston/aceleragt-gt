'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useSellerContext } from '@/contexts/SellerContext';
import { MobileSidebar } from './MobileSidebar';
import {
  LayoutDashboard,
  Trophy,
  Target,
  Gem,
  LogOut,
  Zap,
  BookOpen,
  Calendar,
  User
} from 'lucide-react';

const navItems = [
  { href: '/seller/dashboard', label: 'Meu Desempenho', icon: LayoutDashboard },
  { href: '/seller/ranking', label: 'Ranking Geral', icon: Trophy },
  { href: '/seller/missions', label: 'Missões', icon: Target },
  { href: '/seller/sprints', label: 'Corridinha', icon: Zap },
  { href: '/seller/loja', label: 'Loja de Prémios', icon: Gem },
  { href: '/seller/academia', label: 'Academia', icon: BookOpen },
  { href: '/seller/escala', label: 'Minha Escala', icon: Calendar },
  { href: '/seller/perfil', label: 'Meu Perfil', icon: User },
];

export default function SellerSidebar() {
  const pathname = usePathname();
  const { currentSeller } = useSellerContext();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (!currentSeller) {
    // Renderiza um placeholder para evitar que o layout "salte"
    return <div className="hidden lg:flex w-64 flex-shrink-0" />;
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card text-card-foreground">
        <div className="p-4 border-b">
          <Link href="/seller/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">{currentSeller.name.split(' ')[0]}</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <div className="lg:hidden">
        <MobileSidebar navItems={navItems} onLogout={handleLogout} />
      </div>
    </>
  );
}