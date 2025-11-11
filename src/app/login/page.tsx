"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';
import Link from 'next/link';

type AuthMode = 'password' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include',
        body: JSON.stringify({ email, password }) 
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Login] Response data:', data);
        
        // Wait a bit for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify session is active
        try {
          const verifyRes = await fetch('/api/user/me', { 
            credentials: 'include',
            cache: 'no-store'
          });
          
          if (!verifyRes.ok) {
            console.error('[Login] ⚠️ Session verification failed:', verifyRes.status);
            setError('Erreur de session. Veuillez réessayer.');
            return;
          }
          
          const userData = await verifyRes.json();
          console.log('[Login] ✅ Session verified, user:', userData.email);
          
          // Import saveCurrentAccount dynamically
          const { saveCurrentAccount } = await import('@/lib/multi-account');
          await saveCurrentAccount();
          console.log('[Login] ✅ Account saved to multi-account list');
        } catch (e) {
          console.error('[Login] ⚠️ Error verifying session:', e);
        }
        
        // Check if email confirmation is required
        if (data.needsEmailConfirmation) {
          console.log('[Login] Email confirmation required, redirecting to confirmation page...');
          window.location.href = `/auth/confirm-email?email=${encodeURIComponent(email)}`;
          return;
        }
        
        // Wait a bit more to ensure cookies are fully set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if user needs onboarding
        if (data.needsOnboarding) {
          console.log('[Login] User needs onboarding, redirecting...');
          window.location.href = '/onboarding/role';
        } else {
          console.log('[Login] User already has role, redirecting to missions...');
          window.location.href = '/missions';
        }
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[Login] Error response:', res.status, data);
        setError(data.error || 'Erreur lors de la connexion');
      }
    } catch (e: any) {
      console.error('[Login] Exception:', e);
      setError(`Erreur de connexion: ${e.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/magic', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }) 
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'envoi du lien');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <>
      <AuthCallbackHandler />
      <div className="max-w-sm mx-auto">
        <h1 className="text-xl font-semibold mb-4">Connexion</h1>
        
        {/* Mode selector */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError('');
              setSent(false);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'password'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email / Mot de passe
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('magic');
              setError('');
              setSent(false);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'magic'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lien magique
          </button>
        </div>

        {mode === 'password' ? (
          <>
            {sent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ Connexion réussie ! Redirection...
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <div>
                  <Input 
                    type="email" 
                    placeholder="email@exemple.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input 
                    type="password" 
                    placeholder="Mot de passe" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            )}
          </>
        ) : (
          <>
            {sent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">✅ Vérifiez votre email. Un lien de connexion vous a été envoyé.</p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <Input 
                    type="email" 
                    placeholder="email@exemple.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Envoi...' : 'Envoyer lien magique'}
                </Button>
              </form>
            )}
          </>
        )}

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </>
  );
}


