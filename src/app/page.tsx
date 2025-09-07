'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se a sessão ainda está a ser verificada, não faz nada
    if (status === 'loading') return;

    // Se não há sessão, redireciona para o login
    if (!session) {
      router.push('/login');
      return;
    }

    // Se há sessão, verifica a função e redireciona
    if (session.user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (session.user?.role === 'seller') {
      router.push('/seller/dashboard');
    } else {
      // Caso de fallback, se o utilizador não tiver uma função válida
      router.push('/login');
    }
  }, [session, status, router]);

  // Exibe um indicador de carregamento enquanto a verificação acontece
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}