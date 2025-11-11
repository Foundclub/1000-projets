import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const me = await getCurrentUser(req, res);
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { email, role } = await req.json();
  if (!email || !['ANNONCEUR', 'MISSIONNAIRE'].includes(role)) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  const u = await prisma.user.update({ where: { email }, data: { role: role as Role } });
  return NextResponse.json({ user: u });
}


