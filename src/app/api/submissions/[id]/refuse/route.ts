import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { decisionSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const { id } = await params;
  const user = await getCurrentUser(req, res);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const key = keyFromReq(req as any, user.id);
  if (!limit(key+':decision', 10, 60_000)) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success || !parsed.data.reason) return NextResponse.json({ error: 'Motif requis' }, { status: 400 });
  const sub = await prisma.submission.findUnique({ where: { id }, include: { mission: true } });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sub.mission.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (sub.status !== 'PENDING') return NextResponse.json({ error: 'Déjà tranchée' }, { status: 400 });
  const now = new Date();
  const updated = await prisma.submission.update({ where: { id: sub.id }, data: { status: 'REFUSED', decisionAt: now, reason: parsed.data.reason } });
  
  // Créer une notification pour le missionnaire
  try {
    await createNotification(sub.userId, 'SUBMISSION_REJECTED', {
      missionId: sub.mission.id,
      missionTitle: sub.mission.title,
      submissionId: updated.id,
      reason: parsed.data.reason,
    });
  } catch (notifError) {
    console.error('Error creating notification for submission rejection:', notifError);
  }

  return NextResponse.json({ submission: updated });
}


