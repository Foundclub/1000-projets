import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const { id } = await params;
  const me = await getCurrentUser(req, res);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { proofShots } = await req.json();
  if (!Array.isArray(proofShots) || proofShots.length === 0) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  const sub = await prisma.submission.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sub.userId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const updated = await prisma.submission.update({ where: { id: sub.id }, data: { proofShots } });
  return NextResponse.json({ submission: updated });
}


