import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/client-utils';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export const EmptyState = ({ Icon, title, description, className }: EmptyStateProps) => {
  return (
    <Card className={cn("text-center", className)}>
      <CardContent className="p-10">
        <Icon className="mx-auto size-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
};
