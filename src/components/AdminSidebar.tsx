// src/components/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { MobileSidebar } from './MobileSidebar';
import {
  LayoutDashboard,
  Users,
  Target,
  Settings,
  History,
  Trophy,
  LogOut,
  Rocket,
  Calendar,
  BookOpen
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sellers', label: 'Vendedores', icon: Users },
  { href: '/admin/missions', label: 'Missões', icon: Target },
  { href: '/admin/sprints', label: 'Corridinhas', icon: Rocket },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/escala', label: 'Escala', icon: Calendar },
  { href: '/admin/academia', label: 'Academia', icon: BookOpen },
  { href: '/admin/historico', label: 'Histórico', icon: History },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Barra lateral para desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card text-card-foreground">
        <div className="p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">Painel Admin</span>
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
      
      {/* Menu para telas móveis */}
      <div className="lg:hidden">
        <MobileSidebar navItems={navItems} onLogout={handleLogout} />
      </div>
    </>
  );
}