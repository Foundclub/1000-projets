import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { HomePageContent } from './home-page-content';

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Debug log
  console.log('[HomePage] User:', user?.email, 'roleChosenAt:', (user as any)?.roleChosenAt);
  
  // If user is logged in, redirect to appropriate page
  if (user) {
    // Check if user needs onboarding
    if (!(user as any).roleChosenAt) {
      console.log('[HomePage] ✅ Redirecting to onboarding for user:', user.email);
      redirect('/onboarding/role');
    }
    
    // Redirect to missions (client handler will catch hash fragments)
    redirect('/missions');
  }
  
  // If not logged in, show public landing page
  return <HomePageContent />;
}


