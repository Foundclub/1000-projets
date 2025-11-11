import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            res.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            res.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('[Login] Supabase auth error:', authError);
      // Check if error is due to unconfirmed email
      if (authError.message.includes('email') && authError.message.includes('confirm')) {
        return NextResponse.json({ 
          error: authError.message,
          needsEmailConfirmation: true 
        }, { status: 401 });
      }
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      console.error('[Login] No user returned from Supabase');
      return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
    }

    console.log('[Login] User logged in:', authData.user.id, 'email confirmed:', authData.user.email_confirmed_at ? 'yes' : 'no');
    console.log('[Login] Session:', authData.session ? 'present' : 'null');

    // Check if email confirmation is required
    const needsEmailConfirmation = !authData.session && !authData.user.email_confirmed_at;
    if (needsEmailConfirmation) {
      console.log('[Login] Email confirmation required');
      return NextResponse.json({ 
        error: 'Veuillez vérifier votre email avant de vous connecter',
        needsEmailConfirmation: true 
      }, { status: 401 });
    }

    // Ensure user exists in Prisma
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: 'MISSIONNAIRE' as any,
      },
    });

    // Check if user needs onboarding
    const needsOnboarding = !user.roleChosenAt;

    console.log('[Login] Success - User:', user.email, 'needsOnboarding:', needsOnboarding, 'hasSession:', !!authData.session);

    // Return response with cookies set by Supabase
    const response = NextResponse.json({ 
      ok: true, 
      needsOnboarding,
      hasSession: !!authData.session,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
    
    // Copy cookies from res to response
    res.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    
    return response;
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

