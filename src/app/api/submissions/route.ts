import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submissionCreateSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const key = keyFromReq(req as any, user.id);
    if (!limit(key+':submission', 10, 60_000)) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const body = await req.json();
    const parsed = submissionCreateSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || parsed.error.message;
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    // Validate: at least URL or proofShots
    if (!parsed.data.proofUrl?.trim() && (!parsed.data.proofShots || parsed.data.proofShots.length === 0)) {
      return NextResponse.json({ error: "Au moins une preuve est requise : URL ou captures d'écran" }, { status: 400 });
    }
    const mission = await prisma.mission.findUnique({ where: { id: parsed.data.missionId } });
    if (!mission || mission.status !== 'OPEN') return NextResponse.json({ error: 'Mission indisponible' }, { status: 400 });
    const sub = await prisma.submission.create({ 
      data: { 
        missionId: mission.id, 
        userId: user.id, 
        proofUrl: parsed.data.proofUrl?.trim() || 'N/A', 
        proofShots: parsed.data.proofShots ?? [],
        comments: parsed.data.comments?.trim() || undefined
      } 
    });
    return NextResponse.json({ submission: sub }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


