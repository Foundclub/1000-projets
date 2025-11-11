import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { z } from 'zod';

const annonceurOnboardingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  avatarUrl: z.string().optional(),
  // Organization fields
  organizationName: z.string().min(1),
  organizationLogoUrl: z.string().optional(),
  organizationCoverUrl: z.string().optional(),
  organizationBio: z.string().optional(),
  organizationWebsite: z.string().url().optional().or(z.literal('')),
  // KYC
  justificatifUrl: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const parsed = annonceurOnboardingSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      avatarUrl,
      organizationName,
      organizationLogoUrl,
      organizationCoverUrl,
      organizationBio,
      organizationWebsite,
      justificatifUrl,
    } = parsed.data;

    // Generate unique slug from organization name
    let baseSlug = slugify(organizationName);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists, if so add a counter
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create Organization and update User in a transaction
    await prisma.$transaction(async (tx) => {
      // Create Organization
      await tx.organization.create({
        data: {
          slug,
          name: organizationName,
          logoUrl: organizationLogoUrl || null,
          coverUrl: organizationCoverUrl || null,
          bio: organizationBio || null,
          website: organizationWebsite || null,
          ownerId: user.id,
        },
      });

      // Update User with annonceur data and set request status
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          avatar: avatarUrl || null,
          justificatifUrl,
          roleChosenAt: new Date(),
          annonceurRequestStatus: 'PENDING',
          // Role stays MISSIONNAIRE until approved
        },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in onboarding annonceur:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


