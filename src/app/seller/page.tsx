import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redireciona o utilizador da rota /seller para o dashboard do vendedor.
  redirect('/seller/dashboard');
  return null;
}