"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';
import Link from 'next/link';

type RoleChoice = 'MISSIONNAIRE' | 'ANNONCEUR' | 'ADMIN' | null;

export default function SignupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleChoice>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include',
        body: JSON.stringify({ email, password }) 
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Signup] Response data:', data);
        
        // Check if email confirmation is required
        if (data.needsEmailConfirmation) {
          console.log('[Signup] Email confirmation required, redirecting to confirmation page...');
          router.push(`/auth/confirm-email?email=${encodeURIComponent(email)}`);
          return;
        }
        
        // If session exists, verify it and save account
        if (data.hasSession) {
          console.log('[Signup] ✅ Session exists, verifying...');
          // Wait a bit for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const verifyRes = await fetch('/api/user/me', { 
              credentials: 'include',
              cache: 'no-store'
            });
            
            if (verifyRes.ok) {
              const userData = await verifyRes.json();
              console.log('[Signup] ✅ Session verified, user:', userData.email);
              
              // Import saveCurrentAccount dynamically
              const { saveCurrentAccount } = await import('@/lib/multi-account');
              await saveCurrentAccount();
              console.log('[Signup] ✅ Account saved to multi-account list');
            } else {
              console.error('[Signup] ⚠️ Session verification failed:', verifyRes.status);
            }
          } catch (e) {
            console.error('[Signup] ⚠️ Error verifying session:', e);
          }
        }
        
        // Wait a bit more to ensure cookies are fully set (if session exists)
        if (data.hasSession) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Check if user needs onboarding
        if (data.needsOnboarding) {
          console.log('[Signup] User needs onboarding, redirecting...');
          // Redirect to onboarding based on selected role
          if (selectedRole === 'MISSIONNAIRE') {
            window.location.href = '/onboarding/missionnaire';
          } else if (selectedRole === 'ANNONCEUR') {
            window.location.href = '/onboarding/annonceur';
          } else if (selectedRole === 'ADMIN') {
            window.location.href = '/onboarding/admin';
          } else {
            window.location.href = '/onboarding/role';
          }
        } else {
          console.log('[Signup] User already has role, redirecting to missions...');
          window.location.href = '/missions';
        }
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[Signup] Error response:', res.status, data);
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (e: any) {
      console.error('[Signup] Exception:', e);
      setError(`Erreur d'inscription: ${e.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  if (!selectedRole) {
    return (
      <>
        <AuthCallbackHandler />
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Créer un compte</h1>
          <p className="text-muted-foreground mb-6">
            Sélectionnez le rôle qui correspond le mieux à votre utilisation de la plateforme.
            Vous pourrez modifier ce choix plus tard depuis votre profil.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setSelectedRole('MISSIONNAIRE')}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👤</div>
              <h3 className="font-semibold mb-2">Missionnaire</h3>
              <p className="text-sm text-muted-foreground">
                Je veux participer aux missions et gagner des récompenses
              </p>
            </button>
            
            <button
              onClick={() => setSelectedRole('ANNONCEUR')}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🏢</div>
              <h3 className="font-semibold mb-2">Annonceur</h3>
              <p className="text-sm text-muted-foreground">
                Je veux créer des missions et recruter des talents
              </p>
            </button>
            
            <button
              onClick={() => setSelectedRole('ADMIN')}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold mb-2">Admin</h3>
              <p className="text-sm text-muted-foreground">
                Je veux gérer la plateforme et valider les demandes
              </p>
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthCallbackHandler />
      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">Créer un compte</h1>
        
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Rôle sélectionné :</p>
          <p className="text-sm text-muted-foreground">
            {selectedRole === 'MISSIONNAIRE' && '👤 Missionnaire'}
            {selectedRole === 'ANNONCEUR' && '🏢 Annonceur'}
            {selectedRole === 'ADMIN' && '⚙️ Admin'}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRole(null)}
            className="mt-2"
          >
            Changer de rôle
          </Button>
        </div>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Inscription réussie ! Redirection...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
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
                placeholder="Mot de passe (min. 6 caractères)" 
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
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </>
  );
}

