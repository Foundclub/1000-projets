import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  const supabase = supabaseServer();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.signInWithOtp({ 
    email, 
    options: { 
      emailRedirectTo: `${baseUrl}/auth/callback`
    } 
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


