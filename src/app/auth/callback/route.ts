import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { ensureAdminForEmail } from '@/lib/admin-bootstrap';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  console.log('[Auth Callback] URL:', req.url);
  console.log('[Auth Callback] Code:', code ? 'present' : 'missing');
  console.log('[Auth Callback] All params:', Object.fromEntries(requestUrl.searchParams.entries()));

  if (code) {
    // Créer une réponse temporaire pour que Supabase puisse définir les cookies
    let redirectUrl = `${origin}/missions`;
    const tempResponse = NextResponse.next();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            tempResponse.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            tempResponse.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Exchange the code for a session
    console.log('[Auth Callback] Exchanging code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[Auth Callback] ❌ Error exchanging code:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    console.log('[Auth Callback] ✅ Code exchanged successfully');
    console.log('[Auth Callback] User email:', data.user?.email);
    console.log('[Auth Callback] Cookies set:', tempResponse.cookies.getAll().map(c => c.name));

    // Get user email
    const email = data.user?.email;
    if (email) {
      // Ensure user exists in Prisma
      const prismaUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, role: Role.MISSIONNAIRE },
      });

      // Bootstrap admin: si l'email est whitelisté, promouvoir en ADMIN
      await ensureAdminForEmail(email);
      
      // Re-fetch user après bootstrap admin pour avoir le rôle à jour
      const updatedUser = await prisma.user.findUnique({
        where: { email },
      });
      
      const finalUser = updatedUser || prismaUser;

      console.log('[Auth Callback] Prisma user:', email, 'role:', finalUser?.role, 'roleChosenAt:', (finalUser as any).roleChosenAt);
      console.log('[Auth Callback] Email confirmed:', data.user?.email_confirmed_at ? 'yes' : 'no');

      // Check if email was just confirmed
      if (data.user?.email_confirmed_at) {
        console.log('[Auth Callback] ✅ Email confirmed');
      }

      // Check if this is an email confirmation (user was on confirm-email page)
      const type = requestUrl.searchParams.get('type');
      const isEmailConfirmation = type === 'signup' || data.user?.email_confirmed_at;
      
      if (isEmailConfirmation && !(finalUser as any).roleChosenAt) {
        // Email just confirmed, redirect to confirm-email page with success flag
        console.log('[Auth Callback] ✅ Email confirmed, redirecting to confirm-email page');
        redirectUrl = `${origin}/auth/confirm-email?email=${encodeURIComponent(email)}&confirmed=true`;
      } else if (finalUser && finalUser.role === Role.ADMIN) {
        // Si l'utilisateur est ADMIN, il n'a pas besoin d'onboarding
        console.log('[Auth Callback] ✅ User is ADMIN, redirecting to /admin');
        redirectUrl = `${origin}/admin`;
      } else if (finalUser && !(finalUser as any).roleChosenAt) {
        // Check if user needs onboarding
        console.log('[Auth Callback] ✅ User needs onboarding, redirecting to /onboarding/role');
        redirectUrl = `${origin}/onboarding/role`;
      } else {
        console.log('[Auth Callback] ✅ User already has roleChosenAt, redirecting to /missions');
        redirectUrl = `${origin}/missions`;
      }
    } else {
      console.log('[Auth Callback] ⚠️ No email found in user data');
    }

    // Créer la réponse de redirection finale avec tous les cookies
    const finalResponse = NextResponse.redirect(redirectUrl);
    
    // Copier tous les cookies de la réponse temporaire
    tempResponse.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    
    console.log('[Auth Callback] Final redirect to:', redirectUrl);
    console.log('[Auth Callback] Final cookies:', finalResponse.cookies.getAll().map(c => c.name));
    
    return finalResponse;
  }

  // No code, redirect to login
  console.log('[Auth Callback] ❌ No code found, redirecting to login');
  return NextResponse.redirect(`${origin}/login`);
}
