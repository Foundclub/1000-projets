"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { saveCurrentAccount } from '@/lib/multi-account';

function AuthCallbackHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    async function handleAuthCallback() {
      if (handled) return;
      
      const supabase = supabaseBrowser();
      
      // Check for hash fragments (Supabase sometimes uses #access_token=...)
      const hash = window.location.hash;
      console.log('[AuthCallbackHandler] Current URL:', window.location.href);
      console.log('[AuthCallbackHandler] Hash:', hash);
      
      if (hash && hash.length > 1) {
        console.log('[AuthCallbackHandler] Hash found:', hash);
        // Extract access_token and other params from hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('[AuthCallbackHandler] Access token:', accessToken ? 'present' : 'missing');
        console.log('[AuthCallbackHandler] Refresh token:', refreshToken ? 'present' : 'missing');
        console.log('[AuthCallbackHandler] Type:', type);
        
        if (accessToken && refreshToken) {
          setHandled(true);
          console.log('[AuthCallbackHandler] Setting session from hash...');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('[AuthCallbackHandler] ❌ Error setting session:', error);
              router.push('/login?error=auth_failed');
              return;
            }
            
            if (data.user) {
              console.log('[AuthCallbackHandler] ✅ Session set, user:', data.user.email);
              
              // Wait a bit for cookies to be set
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Check if user needs onboarding
              const res = await fetch('/api/user/me', { 
                credentials: 'include',
                cache: 'no-store'
              });
              
              if (res.ok) {
                const userData = await res.json();
                console.log('[AuthCallbackHandler] User data:', userData);
                
                // Sauvegarder le compte dans la liste des comptes multiples
                await saveCurrentAccount();
                
                // Check roleChosenAt
                if (!userData.roleChosenAt) {
                  console.log('[AuthCallbackHandler] ✅ User needs onboarding, redirecting...');
                  // Clear hash before redirect
                  window.history.replaceState(null, '', window.location.pathname);
                  router.push('/onboarding/role');
                  return;
                }
              } else {
                console.error('[AuthCallbackHandler] ⚠️ Failed to fetch user data:', res.status);
              }
              
              // Clear hash and redirect
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/missions');
            }
          } catch (e) {
            console.error('[AuthCallbackHandler] ❌ Exception:', e);
          }
        } else {
          console.log('[AuthCallbackHandler] ⚠️ Missing tokens in hash');
        }
      }
      
      // Check for code in query params
      const code = searchParams.get('code');
      if (code) {
        console.log('[AuthCallbackHandler] Code found in query params');
        setHandled(true);
        // The server-side callback should handle this, but if we're here, redirect to callback
        router.push(`/auth/callback?code=${code}`);
      }
    }
    
    handleAuthCallback();
  }, [router, searchParams, handled]);

  return null;
}

export function AuthCallbackHandler() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackHandlerContent />
    </Suspense>
  );
}

