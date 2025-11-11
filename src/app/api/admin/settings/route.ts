import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/db';

// Pour l'instant, on stocke les paramètres dans une table Settings
// Si elle n'existe pas, on peut utiliser une table simple ou un JSON dans la DB
// Pour simplifier, on utilise une table Settings avec une seule ligne

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Pour l'instant, on retourne des valeurs par défaut
    // TODO: Créer une table Settings dans Prisma si nécessaire
    const settings = {
      slaDecisionH: 48,
      slaRewardH: 72,
      cgu: '',
      charte: '',
      xpRules: {
        followClub: 5,
        acceptanceBase: 20,
        acceptancePro: 60,
        acceptanceSolid: 60,
        bonusFollowedClub: 10,
        decayThreshold: 3,
      },
    };

    return NextResponse.json({ settings });
  } catch (e: any) {
    console.error('Error in GET /api/admin/settings:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-settings`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { slaDecisionH, slaRewardH, cgu, charte, xpRules } = body;

    // Validation basique
    if (typeof slaDecisionH !== 'number' || slaDecisionH < 1 || slaDecisionH > 168) {
      return NextResponse.json({ error: 'Invalid slaDecisionH' }, { status: 400 });
    }

    if (typeof slaRewardH !== 'number' || slaRewardH < 1 || slaRewardH > 168) {
      return NextResponse.json({ error: 'Invalid slaRewardH' }, { status: 400 });
    }

    // Pour l'instant, on ne sauvegarde pas (pas de table Settings)
    // TODO: Créer une table Settings dans Prisma si nécessaire
    // await prisma.settings.upsert({ ... });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in PUT /api/admin/settings:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


