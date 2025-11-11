import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminForEmail } from '@/lib/admin-bootstrap';

/**
 * Route de secours pour bootstrap admin
 * POST /api/admin/bootstrap
 * Body: { email, secret }
 * 
 * Vérifie que secret === ADMIN_BOOTSTRAP_SECRET
 * Si OK, appelle ensureAdminForEmail(email)
 * 
 * RBAC non requis (secret = garde-fou)
 * À supprimer une fois l'admin créé
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, secret } = body;
    
    if (!email || !secret) {
      return NextResponse.json({ error: 'Email et secret requis' }, { status: 400 });
    }
    
    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_BOOTSTRAP_SECRET non configuré' }, { status: 500 });
    }
    
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Secret invalide' }, { status: 403 });
    }
    
    await ensureAdminForEmail(email);
    
    return NextResponse.json({ 
      ok: true, 
      message: `Admin bootstrap effectué pour ${email}` 
    });
  } catch (e: any) {
    console.error('[Admin Bootstrap] Error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


