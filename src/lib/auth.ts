import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ensureAdminForEmail } from '@/lib/admin-bootstrap';

export async function getServerSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export async function getSession() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function syncPrismaUserFromSupabase() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: Role.MISSIONNAIRE },
  });
  return user;
}

// Helper pour créer un client Supabase depuis une requête API
export function supabaseFromRequest(req: NextRequest, res: NextResponse) {
  return createServerClient(
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
}

export async function getCurrentUser(req?: NextRequest, res?: NextResponse) {
  let email: string | null = null;
  if (req && res) {
    // API route: use NextRequest cookies avec get/set/remove
    const supabase = supabaseFromRequest(req, res);
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    email = authUser?.email ?? null;
  } else {
    // Server Component: use cookies() from next/headers
    const session = await getSession();
    email = session?.user?.email ?? null;
  }
  if (!email) {
    console.log('[getCurrentUser] No email found');
    return null;
  }
  
  console.log('[getCurrentUser] Email:', email);
  
  // Ensure user exists (first login)
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { 
      email, 
      role: Role.MISSIONNAIRE,
      // activeRole sera défini après la création si nécessaire
    },
  });
  
  // S'assurer que activeRole est défini (fallback sur role si null)
  if (!(user as any).activeRole) {
    await prisma.user.update({
      where: { email },
      data: { activeRole: user.role },
    });
    (user as any).activeRole = user.role;
  }
  
  console.log('[getCurrentUser] User before bootstrap:', email, 'role:', user.role);
  
  // Bootstrap admin: si l'email est whitelisté, promouvoir en ADMIN
  await ensureAdminForEmail(email);
  
  // Re-fetch user si promotion admin a eu lieu
  const finalUser = await prisma.user.findUnique({
    where: { email },
  });
  
  console.log('[getCurrentUser] User after bootstrap:', email, 'role:', finalUser?.role);
  
  // S'assurer que activeRole est défini (fallback sur role si null)
  if (finalUser && !(finalUser as any).activeRole) {
    await prisma.user.update({
      where: { email },
      data: { activeRole: finalUser.role },
    });
    (finalUser as any).activeRole = finalUser.role;
  }
  
  return finalUser || user;
}


