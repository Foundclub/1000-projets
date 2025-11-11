import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
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

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (authError) {
      console.error('[Signup] Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.error('[Signup] No user returned from Supabase');
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
    }

    console.log('[Signup] User created in Supabase:', authData.user.id, 'email confirmed:', authData.user.email_confirmed_at ? 'yes' : 'no');
    console.log('[Signup] Session:', authData.session ? 'present' : 'null');

    // Check if email confirmation is required
    const needsEmailConfirmation = !authData.session && !authData.user.email_confirmed_at;
    const hasSession = !!authData.session;
    
    if (needsEmailConfirmation) {
      console.log('[Signup] Email confirmation required');
      // User needs to confirm email, but we can still create them in Prisma
      // They will be able to login after confirming
    } else if (hasSession) {
      console.log('[Signup] ✅ Session created, user is logged in');
    }

    // Create user in Prisma
    let user;
    try {
      user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: Role.MISSIONNAIRE,
        },
      });
      console.log('[Signup] User created in Prisma:', user.id);
    } catch (prismaError: any) {
      console.error('[Signup] Prisma error:', prismaError);
      // If user already exists in Prisma, try to fetch it
      if (prismaError.code === 'P2002') {
        user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
        }
        console.log('[Signup] User already exists in Prisma, fetched:', user.id);
      } else {
        return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
      }
    }

    // Check if user needs onboarding
    const needsOnboarding = !user.roleChosenAt;

    console.log('[Signup] Success - User:', user.email, 'needsOnboarding:', needsOnboarding);

    // Return response with cookies set by Supabase
    const response = NextResponse.json({ 
      ok: true, 
      needsOnboarding,
      needsEmailConfirmation,
      hasSession,
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
    console.error('[Signup] Unexpected error:', e);
    console.error('[Signup] Error stack:', e.stack);
    return NextResponse.json({ error: `Erreur serveur: ${e.message || 'Erreur inconnue'}` }, { status: 500 });
  }
}

