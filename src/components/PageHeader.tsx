'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function PageHeader() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  const title = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Home';

  return (
    <div className="w-full bg-background px-4 py-2 border-b">
      <nav className="flex items-center text-sm text-muted-foreground mb-1">
        <Link href="/">Home</Link>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            <ChevronRight className="mx-2 h-4 w-4" />
            {i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    </div>
  );
}
