'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileSidebar } from './MobileSidebar';

export default function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="font-headline">Sales Insights Tracker</span>
        </Link>
      </nav>
      
      <MobileSidebar>
        <nav className="flex flex-col gap-6 text-lg font-medium">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-headline">Sales Insights Tracker</span>
          </Link>
        </nav>
      </MobileSidebar>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Future search bar could go here */}
        </div>
        <Link href="/login" passHref>
           <Button variant="outline">Login</Button>
        </Link>
      </div>
    </header>
  );
}
