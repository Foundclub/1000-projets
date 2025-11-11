import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const res = NextResponse.next();
  const { reportId } = await params;
  const me = await getCurrentUser(req, res);
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { action } = await req.json();
  if (!['RESOLVED', 'REJECTED'].includes(action)) return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  const r = await prisma.report.update({ where: { id: reportId }, data: { status: action } });
  return NextResponse.json({ report: r });
}


