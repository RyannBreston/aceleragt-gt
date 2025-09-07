'use client'

import React from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { LogOut, Menu, type LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface MobileSidebarProps {
  navItems: NavItem[];
  onLogout: () => void;
}

export function MobileSidebar({ navItems, onLogout }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="m-4">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Logo />
            <span>Painel</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}