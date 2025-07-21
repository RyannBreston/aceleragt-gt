'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid } from "lucide-react";

export const DashboardSkeleton = () => {
    return (
        <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-10 md:hidden flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-6 w-24" /></div>
                <Skeleton className="h-8 w-8" />
            </header>
            <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
                <div className="space-y-8 animate-pulse">
                    <div className="flex items-center gap-4">
                        <LayoutGrid className="size-8 text-muted" />
                        <Skeleton className="h-9 w-48" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i} className="bg-card border-border shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-40 mb-2" />
                                    <Skeleton className="h-3 w-48" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2 bg-card border-border shadow-none">
                             <CardContent className="pt-6">
                                <Skeleton className="h-[350px] w-full" />
                             </CardContent>
                        </Card>
                         <Card className="bg-card border-border shadow-none">
                             <CardHeader>
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-full" />
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-20 w-full" />
                             </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};