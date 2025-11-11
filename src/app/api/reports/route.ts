import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { reportCreateSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const user = await getCurrentUser(req, res);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const key = keyFromReq(req as any, user.id);
  if (!limit(key+':report', 5, 60_000)) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  const body = await req.json();
  const parsed = reportCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const r = await prisma.report.create({ data: parsed.data });
  return NextResponse.json({ report: r }, { status: 201 });
}


