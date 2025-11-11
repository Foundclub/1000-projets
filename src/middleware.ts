import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // IMPORTANT: toujours créer une réponse sur laquelle Supabase pourra setter les cookies
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // L'API attend get/set/remove, PAS getAll/setAll
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          // Pour supprimer, on réécrit un cookie expiré
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // getUser() est plus robuste en middleware que getSession()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Debug: log all requests
  console.log('[Middleware] Path:', pathname, 'User:', user?.email || 'none');

  // Skip onboarding check for onboarding routes, login, signup, auth routes, and auth callback
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/api/auth') || pathname.startsWith('/auth/callback')) {
    return res;
  }

  // NOTE: On ne peut PAS utiliser Prisma dans le middleware car il s'exécute en Edge Runtime
  // La vérification du rôle ADMIN et de l'onboarding se fait dans les pages/layouts et routes API
  // Le middleware vérifie uniquement la session Supabase

  // Protège les zones nécessaires (vérification basique de session uniquement)
  // NOTE: La vérification RBAC ADMIN se fait dans les pages/layouts et routes API
  // car Prisma ne peut pas s'exécuter en Edge Runtime (middleware)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/submissions') ||
    pathname.startsWith('/api/threads')
  ) {
    if (!user) {
      console.log('[Middleware] ❌ No user session for protected route:', pathname);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // La vérification RBAC ADMIN se fait dans le layout admin et les routes API
    // On laisse passer ici si l'utilisateur a une session valide
    console.log('[Middleware] ✅ User has session for:', pathname, 'email:', user.email);
  }

  // Protection spécifique pour POST /api/missions
  if (pathname === '/api/missions' && req.method.toUpperCase() === 'POST') {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return res;
}

// IMPORTANT : matcher avec wildcards
// On matche toutes les routes sauf les fichiers statiques et les routes API spécifiques
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


