import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { missionCreateSchema } from '@/lib/validators';
import { canCreateMission } from '@/lib/rbac';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { notifyOrganizationFollowers } from '@/lib/notifications';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const { id } = await params;
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const me = await getCurrentUser(req, res);
  let submissions: any[] = [];
  // Sécurité : ne retourner les preuves que pour owner/admin, jamais pour missionnaire
  if (me && (me.role === 'ADMIN' || me.id === mission.ownerId)) {
    const subs = await prisma.submission.findMany({ where: { missionId: mission.id }, orderBy: { createdAt: 'desc' } });
    const supabase = supabaseServer();
    submissions = await Promise.all(subs.map(async (s) => {
      const shots: string[] = Array.isArray(s.proofShots) ? (s.proofShots as any) : [];
      const signed: string[] = [];
      for (const path of shots) {
        const { data } = await supabase.storage.from('proofs').createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) signed.push(data.signedUrl);
      }
      return { ...s, proofShotsSigned: signed };
    }));
  }
  return NextResponse.json({ mission, submissions });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !canCreateMission(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':update-mission', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: { ownerId: true, organizationId: true },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = missionCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { imageUrl, rewardText, rewardEscrowContent, rewardMediaUrl, organizationId, baseXp, bonusXp, ...missionData } = parsed.data;

    // Vérifier que l'organization appartient à l'utilisateur si organizationId est fourni
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { ownerId: true },
      });
      
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      if (organization.ownerId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: You do not own this organization' }, { status: 403 });
      }
    }

    // Vérifier que seuls les admins peuvent modifier baseXp et bonusXp
    if ((baseXp !== undefined || bonusXp !== undefined) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can set baseXp and bonusXp' }, { status: 403 });
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: {
        ...missionData,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
        rewardText: rewardText !== undefined ? (rewardText || null) : undefined,
        rewardEscrowContent: rewardEscrowContent !== undefined ? (rewardEscrowContent || null) : undefined,
        rewardMediaUrl: rewardMediaUrl !== undefined ? (rewardMediaUrl || null) : undefined,
        organizationId: organizationId !== undefined ? (organizationId || null) : undefined,
        baseXp: baseXp !== undefined ? baseXp : undefined,
        bonusXp: bonusXp !== undefined ? bonusXp : undefined,
      } as any,
    });

    // Notifier les followers si l'organization a changé ou si c'est une nouvelle mission avec organization
    if (organizationId && (organizationId !== mission.organizationId)) {
      await notifyOrganizationFollowers(organizationId, updated.id, updated.title);
    }

    return NextResponse.json({ mission: updated });
  } catch (e: any) {
    console.error('Error updating mission:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !canCreateMission(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':delete-mission', 5, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    // Supprimer la mission (cascade supprimera les submissions et ratings associés)
    await prisma.mission.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting mission:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
