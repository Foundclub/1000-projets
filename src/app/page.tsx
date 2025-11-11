import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Debug log
  console.log('[HomePage] User:', user?.email, 'roleChosenAt:', (user as any)?.roleChosenAt);
  
  // If not logged in, redirect to login
  if (!user) {
    console.log('[HomePage] ❌ No user, redirecting to login');
    redirect('/login');
  }
  
  // Check if user needs onboarding
  if (!(user as any).roleChosenAt) {
    console.log('[HomePage] ✅ Redirecting to onboarding for user:', user.email);
    redirect('/onboarding/role');
  }
  
  // Redirect to missions (client handler will catch hash fragments)
  redirect('/missions');
}


