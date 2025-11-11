import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { z } from 'zod';

const activeRoleSchema = z.object({
  activeRole: z.enum(['MISSIONNAIRE', 'ANNONCEUR', 'ADMIN']),
});

/**
 * POST /api/user/active-role
 * Change le rôle actif de l'utilisateur (sans modifier les privilèges)
 * RBAC: Authenticated only
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const parsed = activeRoleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { activeRole } = parsed.data;
    
    // Vérifier que l'utilisateur a le privilège pour ce rôle
    // Un utilisateur peut seulement activer un rôle qu'il possède déjà
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur peut activer ce rôle
    // - MISSIONNAIRE : toujours disponible
    // - ANNONCEUR : seulement si role === 'ANNONCEUR' ou 'ADMIN'
    // - ADMIN : seulement si role === 'ADMIN'
    if (activeRole === 'ANNONCEUR' && fullUser.role !== 'ANNONCEUR' && fullUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez pas activer le rôle Annonceur sans les privilèges nécessaires' }, { status: 403 });
    }
    
    if (activeRole === 'ADMIN' && fullUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez pas activer le rôle Admin sans les privilèges nécessaires' }, { status: 403 });
    }
    
    // Mettre à jour le rôle actif
    await prisma.user.update({
      where: { id: user.id },
      data: { activeRole: activeRole as Role },
    });
    
    return NextResponse.json({ success: true, activeRole });
  } catch (e: any) {
    console.error('Error changing active role:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/user/active-role
 * Récupère le rôle actif de l'utilisateur
 * RBAC: Authenticated only
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, activeRole: true },
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Si activeRole n'est pas défini, utiliser role par défaut
    const activeRole = fullUser.activeRole || fullUser.role;
    
    return NextResponse.json({ role: fullUser.role, activeRole });
  } catch (e: any) {
    console.error('Error fetching active role:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


