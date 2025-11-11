import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

const xpBonusSchema = z.object({
  delta: z.number().int().min(-10000).max(10000), // Limite raisonnable pour éviter les abus
  space: z.enum(['PRO', 'SOLIDAIRE']).optional().nullable(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/admin/users/[id]/xp-bonus
 * Attribuer un bonus manuel d'XP à un utilisateur
 * RBAC: ADMIN uniquement
 * Rate limit: 10/min
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-xp-bonus`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id: userId } = await params;
    const body = await req.json();
    const parsed = xpBonusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { delta, space, description } = parsed.data;

    // Vérifier que l'utilisateur existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Attribuer le bonus d'XP
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'XP de l'utilisateur
      const updateData: any = {};
      if (space === 'PRO') {
        updateData.xpPro = { increment: delta };
      } else if (space === 'SOLIDAIRE') {
        updateData.xpSolid = { increment: delta };
      } else {
        // Général
        updateData.xp = { increment: delta };
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Créer un XpEvent
      await (tx as any).xpEvent.create({
        data: {
          userId,
          missionId: null,
          kind: 'BONUS_MANUAL',
          delta,
          space: space || null,
          description: description || `Bonus manuel attribué par ${user.email}`,
        },
      });

      // Récupérer l'utilisateur mis à jour
      return await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          xpPro: true,
          xpSolid: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      user: result,
      delta,
      space: space || 'Général',
    });
  } catch (e: any) {
    console.error('Error in POST /api/admin/users/[id]/xp-bonus:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

