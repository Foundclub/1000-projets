import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { messageCreateSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

function maskContacts(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email masqué]')
    .replace(/\b\+?\d[\d\s().-]{6,}\b/g, '[téléphone masqué]');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await prisma.thread.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } }, submission: { include: { mission: true } } } });
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ messages: thread.messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const { id } = await params;
  const user = await getCurrentUser(req, res);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const key = keyFromReq(req as any, user.id);
  if (!limit(key+':message', 30, 60_000)) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  const thread = await prisma.thread.findUnique({ where: { id }, include: { submission: { include: { mission: true } } } });
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (![thread.aId, thread.bId].includes(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body: any = {};
  if (req.headers.get('content-type')?.includes('application/json')) body = await req.json();
  else if (req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData(); body = { content: String(form.get('content') || '') };
  }
  const parsed = messageCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const content = maskContacts(parsed.data.content);
  const msg = await prisma.message.create({ data: { threadId: thread.id, authorId: user.id, type: parsed.data.type, content } });
  return NextResponse.json({ message: msg }, { status: 201 });
}


