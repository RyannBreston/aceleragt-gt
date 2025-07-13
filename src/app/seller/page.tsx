import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redireciona o utilizador da raiz ("/") para a página de login.
  redirect('/login');
  return null;
}
