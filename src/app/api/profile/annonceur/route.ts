import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Fonction pour normaliser l'URL (ajouter https:// si nécessaire)
function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') return '';
  const trimmed = url.trim();
  // Si l'URL commence déjà par http:// ou https://, la retourner telle quelle
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // Sinon, ajouter https://
  return `https://${trimmed}`;
}

const annonceurProfileUpdateSchema = z.object({
  bio: z.string().optional().nullable(),
  activities: z.string().optional().nullable(),
  website: z.union([
    z.string().transform((val) => {
      if (!val || val.trim() === '') return null;
      return normalizeUrl(val);
    }).refine((val) => {
      if (!val) return true; // null est valide
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, { message: 'URL invalide' }),
    z.literal('').transform(() => null),
    z.null(),
  ]).optional(),
});

export async function PUT(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (user.role !== 'ANNONCEUR') {
      return NextResponse.json({ error: 'Only annonceurs can update this profile' }, { status: 403 });
    }
    
    const body = await req.json();
    const parsed = annonceurProfileUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { bio, activities, website } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: bio !== undefined ? (bio === '' ? null : bio) : undefined,
        activities: activities !== undefined ? (activities === '' ? null : activities) : undefined,
        // website est déjà normalisé par le schéma Zod (https:// ajouté si nécessaire, ou null si vide)
        website: website !== undefined ? website : undefined,
      },
    });
    
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Error updating annonceur profile:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

