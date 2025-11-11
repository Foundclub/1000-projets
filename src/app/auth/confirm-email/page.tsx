"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const confirmedParam = searchParams.get('confirmed') === 'true';
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(confirmedParam);

  async function checkEmailConfirmation() {
    setChecking(true);
    try {
      // Attendre un peu pour que les cookies soient bien définis après le callback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Méthode 1: Vérifier via l'API /api/user/me (plus fiable car utilise les cookies serveur)
      try {
        const res = await fetch('/api/user/me', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (res.ok) {
          const userData = await res.json();
          console.log('[ConfirmEmail] API check:', {
            hasUser: !!userData,
            email: userData.email,
            role: userData.role,
          });
          
          // Si l'API retourne un utilisateur, c'est que l'email est confirmé et la session est active
          if (userData && userData.email) {
            console.log('[ConfirmEmail] ✅ Email confirmed via API');
            setConfirmed(true);
            setChecking(false);
            
            // Wait a bit then redirect
            setTimeout(() => {
              if (userData.role === 'ADMIN') {
                router.push('/admin');
              } else {
                router.push('/onboarding/role');
              }
              router.refresh();
            }, 2000);
            return;
          }
        } else {
          console.log('[ConfirmEmail] API check failed:', res.status);
        }
      } catch (apiError) {
        console.error('[ConfirmEmail] API check error:', apiError);
      }
      
      // Méthode 2: Vérifier via Supabase client (fallback)
      const supabase = supabaseBrowser();
      
      // First, try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[ConfirmEmail] Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        emailConfirmed: !!session?.user?.email_confirmed_at,
        email: session?.user?.email,
      });
      
      if (session?.user?.email_confirmed_at) {
        console.log('[ConfirmEmail] ✅ Email confirmed via session');
        setConfirmed(true);
        setChecking(false);
        // Wait a bit then redirect
        setTimeout(async () => {
          // Vérifier si l'utilisateur est ADMIN avant de rediriger
          try {
            const res = await fetch('/api/user/me', { credentials: 'include' });
            if (res.ok) {
              const userData = await res.json();
              if (userData.role === 'ADMIN') {
                router.push('/admin');
              } else {
                router.push('/onboarding/role');
              }
            } else {
              router.push('/onboarding/role');
            }
          } catch (e) {
            router.push('/onboarding/role');
          }
          router.refresh();
        }, 2000);
        return;
      }
      
      // If no session, try getUser (peut fonctionner même sans session active)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('[ConfirmEmail] getUser check:', {
        hasUser: !!user,
        emailConfirmed: !!user?.email_confirmed_at,
        email: user?.email,
        error: error?.message,
      });
      
      if (user && user.email_confirmed_at) {
        console.log('[ConfirmEmail] ✅ Email confirmed via getUser');
        setConfirmed(true);
        setChecking(false);
        // Wait a bit then redirect
        setTimeout(async () => {
          // Vérifier si l'utilisateur est ADMIN avant de rediriger
          try {
            const res = await fetch('/api/user/me', { credentials: 'include' });
            if (res.ok) {
              const userData = await res.json();
              if (userData.role === 'ADMIN') {
                router.push('/admin');
              } else {
                router.push('/onboarding/role');
              }
            } else {
              router.push('/onboarding/role');
            }
          } catch (e) {
            router.push('/onboarding/role');
          }
          router.refresh();
        }, 2000);
        return;
      }
      
      // Email not confirmed yet
      console.log('[ConfirmEmail] ⚠️ Email not confirmed yet', { 
        user: user?.email, 
        confirmed: user?.email_confirmed_at,
        sessionUser: session?.user?.email,
        sessionConfirmed: session?.user?.email_confirmed_at,
      });
      setChecking(false);
    } catch (e: any) {
      console.error('[ConfirmEmail] ❌ Error checking confirmation:', e);
      setChecking(false);
    }
  }

  useEffect(() => {
    // If confirmed param is set, mark as confirmed immediately
    if (confirmedParam) {
      console.log('[ConfirmEmail] ✅ Confirmed param is true, marking as confirmed');
      setConfirmed(true);
      setChecking(false);
      
      // Attendre un peu pour que les cookies soient bien définis
      setTimeout(async () => {
        // Vérifier si l'utilisateur est ADMIN avant de rediriger
        try {
          const res = await fetch('/api/user/me', { credentials: 'include' });
          if (res.ok) {
            const userData = await res.json();
            if (userData.role === 'ADMIN') {
              router.push('/admin');
            } else {
              router.push('/onboarding/role');
            }
          } else {
            router.push('/onboarding/role');
          }
        } catch (e) {
          router.push('/onboarding/role');
        }
        router.refresh();
      }, 2000);
      return;
    }
    
    // Vérifier si on vient du callback (code dans l'URL)
    // Note: useEffect s'exécute côté client, donc window est disponible
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        console.log('[ConfirmEmail] Code found in URL, redirecting to callback...');
        // Rediriger vers le callback pour échanger le code
        router.push(`/auth/callback?code=${code}&type=signup`);
        return;
      }
    }
    
    // Check immediately (avec un petit délai pour laisser les cookies se définir)
    const initialCheck = setTimeout(() => {
      checkEmailConfirmation();
    }, 1000);
    
    // Check every 3 seconds
    const interval = setInterval(() => {
      if (!confirmed && !checking) {
        checkEmailConfirmation();
      }
    }, 3000);
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [confirmed, confirmedParam, checking, router]);

  return (
    <>
      <AuthCallbackHandler />
      <div className="max-w-md mx-auto p-6">
        <div className="text-center space-y-4">
        {confirmed ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600">Email confirmé !</h1>
            <p className="text-muted-foreground">
              Votre email a été confirmé avec succès. Redirection en cours...
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold">Vérifiez votre email</h1>
            <p className="text-muted-foreground">
              Nous avons envoyé un email de confirmation à <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Cliquez sur le lien dans l'email pour confirmer votre compte.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Astuce :</strong> Cette page se met à jour automatiquement une fois votre email confirmé.
              </p>
            </div>
            {checking && (
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground mt-2">Vérification en cours...</p>
              </div>
            )}
            <div className="mt-6 space-y-2">
              <Button
                onClick={checkEmailConfirmation}
                disabled={checking}
                variant="outline"
              >
                {checking ? 'Vérification...' : 'Vérifier à nouveau'}
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}

