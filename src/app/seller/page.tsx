import { redirect } from 'next/navigation';

export default function SellerRootPage() {
  redirect('/seller/dashboard');
  return null;
}
