import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sendAdminNotification } from '@/lib/email';

const onboardingSchema = z.object({
  role: z.enum(['MISSIONNAIRE', 'ANNONCEUR', 'ADMIN']),
  // Annonceur fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  companyName: z.string().optional(),
  avatarUrl: z.string().optional(),
  justificatifUrl: z.string().optional(),
  // Admin fields
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Fetch full user data to check current role and request status
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        roleChosenAt: true,
        annonceurRequestStatus: true,
        adminRequestStatus: true,
      },
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { role, firstName, lastName, dateOfBirth, companyName, avatarUrl, justificatifUrl, phone } = parsed.data;

    if (role === 'MISSIONNAIRE') {
      // Si l'utilisateur est ANNONCEUR ou ADMIN, on change seulement activeRole (pas role)
      if (fullUser.role === 'ANNONCEUR' || fullUser.role === 'ADMIN') {
        // Changer seulement le rôle actif, garder les privilèges
        await prisma.user.update({
          where: { id: user.id },
          data: {
            activeRole: 'MISSIONNAIRE',
            roleChosenAt: fullUser.roleChosenAt || new Date(),
          },
        });
        
        return NextResponse.json({ success: true });
      }
      
      // Si l'utilisateur est déjà MISSIONNAIRE, juste s'assurer que roleChosenAt est défini
      if (fullUser.role === 'MISSIONNAIRE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            roleChosenAt: fullUser.roleChosenAt || new Date(),
            activeRole: 'MISSIONNAIRE', // S'assurer que activeRole est défini
          },
        });
        
        return NextResponse.json({ success: true });
      }
      
      // Cas par défaut : simple set roleChosenAt
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          roleChosenAt: new Date(),
          activeRole: 'MISSIONNAIRE',
        },
      });
      
      return NextResponse.json({ success: true });
    } else if (role === 'ANNONCEUR') {
      // Vérifier si l'utilisateur a déjà une demande en attente
      if (fullUser.annonceurRequestStatus === 'PENDING') {
        return NextResponse.json({ error: 'Vous avez déjà une demande Annonceur en attente' }, { status: 400 });
      }
      
      // Vérifier si l'utilisateur est déjà ANNONCEUR
      if (fullUser.role === 'ANNONCEUR') {
        return NextResponse.json({ error: 'Vous êtes déjà Annonceur' }, { status: 400 });
      }
      
      // Validate required fields
      if (!firstName || !lastName || !companyName || !justificatifUrl) {
        return NextResponse.json({ error: 'Champs requis manquants pour Annonceur' }, { status: 400 });
      }

      // Set roleChosenAt and request status, but keep role as MISSIONNAIRE
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roleChosenAt: fullUser.roleChosenAt || new Date(), // Garder la date existante si déjà définie
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          companyName,
          avatar: avatarUrl || null,
          justificatifUrl,
          annonceurRequestStatus: 'PENDING',
          // Role stays MISSIONNAIRE until approved
        },
      });

      // Envoyer une notification email aux admins (de manière asynchrone, ne bloque pas la réponse)
      const userName = `${firstName} ${lastName}`.trim() || user.email;
      sendAdminNotification({
        type: 'annonceur_request',
        userEmail: user.email,
        userName,
        userId: user.id,
        companyName: companyName || undefined,
        requestDate: new Date(),
      }).catch((error) => {
        console.error('[Onboarding Role] Erreur lors de l\'envoi de l\'email annonceur:', error);
        // Ne pas bloquer la réponse si l'email échoue
      });
      
      return NextResponse.json({ success: true });
    } else if (role === 'ADMIN') {
      // Vérifier si l'utilisateur a déjà une demande en attente
      if (fullUser.adminRequestStatus === 'PENDING') {
        return NextResponse.json({ error: 'Vous avez déjà une demande Admin en attente' }, { status: 400 });
      }
      
      // Vérifier si l'utilisateur est déjà ADMIN
      if (fullUser.role === 'ADMIN') {
        return NextResponse.json({ error: 'Vous êtes déjà Admin' }, { status: 400 });
      }
      
      // Permettre à un ANNONCEUR de demander Admin (même si demande précédente refusée)
      // On réinitialise le statut pour permettre une nouvelle demande
      
      // Validate required fields
      if (!firstName || !lastName || !phone) {
        return NextResponse.json({ error: 'Champs requis manquants pour Admin' }, { status: 400 });
      }

      // Set roleChosenAt and request status, but keep role as MISSIONNAIRE
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roleChosenAt: fullUser.roleChosenAt || new Date(), // Garder la date existante si déjà définie
          firstName,
          lastName,
          phone,
          adminRequestStatus: 'PENDING',
          // Role stays MISSIONNAIRE until approved
        },
      });

      // Envoyer une notification email aux admins (de manière asynchrone, ne bloque pas la réponse)
      const userName = `${firstName} ${lastName}`.trim() || user.email;
      sendAdminNotification({
        type: 'admin_request',
        userEmail: user.email,
        userName,
        userId: user.id,
        phone: phone || undefined,
        requestDate: new Date(),
      }).catch((error) => {
        console.error('[Onboarding Role] Erreur lors de l\'envoi de l\'email admin:', error);
        // Ne pas bloquer la réponse si l'email échoue
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
  } catch (e: any) {
    console.error('Error in onboarding role:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

