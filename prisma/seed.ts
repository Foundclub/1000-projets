import 'dotenv/config';
import { PrismaClient, Role, Space, MissionStatus, FollowTargetType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.ADMIN,
      activeRole: Role.ADMIN,
      roleChosenAt: new Date(),
      firstName: 'Admin',
      lastName: 'User',
      phone: '+33 6 12 34 56 78',
    },
  });

  const annonceur = await prisma.user.upsert({
    where: { email: 'annonceur@example.com' },
    update: {},
    create: {
      email: 'annonceur@example.com',
      displayName: 'Annonceur',
      role: Role.ANNONCEUR,
      activeRole: Role.ANNONCEUR,
      roleChosenAt: new Date(),
      firstName: 'Annonceur',
      lastName: 'Test',
      isCertifiedAnnonceur: true,
    },
  });

  const missionnaire = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      displayName: 'Missionnaire',
      role: Role.MISSIONNAIRE,
      activeRole: Role.MISSIONNAIRE,
      roleChosenAt: new Date(),
      firstName: 'Missionnaire',
      lastName: 'Test',
    },
  });

  console.log('✅ Users created:', { admin: admin.id, annonceur: annonceur.id, missionnaire: missionnaire.id });

  // Create organizations (clubs)
  const organization1 = await prisma.organization.upsert({
    where: { slug: 'club-tech' },
    update: {},
    create: {
      slug: 'club-tech',
      name: 'Club Tech',
      bio: 'Un club de développeurs passionnés par les nouvelles technologies.',
      website: 'https://club-tech.example.com',
      isCertified: true,
      ownerId: annonceur.id,
    },
  });

  const organization2 = await prisma.organization.upsert({
    where: { slug: 'asso-solidarite' },
    update: {},
    create: {
      slug: 'asso-solidarite',
      name: 'Association Solidarité',
      bio: 'Une association caritative qui aide les personnes en difficulté.',
      website: 'https://asso-solidarite.example.com',
      isCertified: false,
      ownerId: annonceur.id,
    },
  });

  console.log('✅ Organizations created:', { org1: organization1.id, org2: organization2.id });

  // Create follows
  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: missionnaire.id,
      targetType: FollowTargetType.ORGANIZATION,
      organizationId: organization1.id,
    },
  });
  
  let follow1;
  if (!existingFollow) {
    follow1 = await prisma.follow.create({
      data: {
        followerId: missionnaire.id,
        targetType: FollowTargetType.ORGANIZATION,
        organizationId: organization1.id,
        targetUserId: null,
      },
    });
  } else {
    follow1 = existingFollow;
  }

  console.log('✅ Follows created:', { follow1: follow1.id });

  // Create missions
  const missionPro = await prisma.mission.upsert({
    where: { id: 'mission-pro-demo' },
    update: {},
    create: {
      id: 'mission-pro-demo',
      title: 'Mission PRO - Développement API REST',
      space: Space.PRO,
      description: 'Créer une API REST complète avec authentification JWT, gestion des utilisateurs et endpoints CRUD pour un système de gestion de tâches.',
      criteria: 'Code source sur GitHub, tests unitaires > 80%, documentation API complète, déploiement sur Vercel/Railway.',
      slotsMax: 3,
      slotsTaken: 0,
      slaDecisionH: 48,
      slaRewardH: 72,
      ownerId: annonceur.id,
      organizationId: organization1.id,
      status: MissionStatus.OPEN,
      isFeatured: true,
      featuredRank: 1,
      rewardText: '100€ + Badge spécial',
    },
  });

  const missionPro2 = await prisma.mission.upsert({
    where: { id: 'mission-pro-demo-2' },
    update: {},
    create: {
      id: 'mission-pro-demo-2',
      title: 'Mission PRO - Application Mobile React Native',
      space: Space.PRO,
      description: 'Développer une application mobile React Native pour iOS et Android avec authentification, base de données et notifications push.',
      criteria: 'Code source sur GitHub, tests unitaires > 70%, déploiement sur App Store et Google Play, documentation complète.',
      slotsMax: 2,
      slotsTaken: 0,
      slaDecisionH: 72,
      slaRewardH: 96,
      ownerId: annonceur.id,
      organizationId: organization1.id,
      status: MissionStatus.OPEN,
      rewardText: '150€',
    },
  });

  const missionSolid = await prisma.mission.upsert({
    where: { id: 'mission-solid-demo' },
    update: {},
    create: {
      id: 'mission-solid-demo',
      title: 'Mission SOLIDAIRE - Site web pour association',
      space: Space.SOLIDAIRE,
      description: 'Développer un site web responsive pour une association caritative locale. Le site doit inclure une page d\'accueil, une page de présentation, un formulaire de contact et une section actualités.',
      criteria: 'Site responsive (mobile-first), accessibilité WCAG AA, hébergement gratuit (Netlify/Vercel), code source open source sur GitHub.',
      slotsMax: 3,
      slotsTaken: 0,
      slaDecisionH: 48,
      slaRewardH: 72,
      ownerId: annonceur.id,
      organizationId: organization2.id,
      status: MissionStatus.OPEN,
      rewardText: 'Badge "Bienfaiteur"',
    },
  });

  console.log('✅ Missions created:', { pro: missionPro.id, pro2: missionPro2.id, solid: missionSolid.id });

  // Create notifications
  const notification1 = await prisma.notification.create({
    data: {
      userId: missionnaire.id,
      type: 'NEW_MISSION',
      payload: {
        organizationId: organization1.id,
        missionId: missionPro.id,
        missionTitle: missionPro.title,
      },
      read: false,
    },
  });

  console.log('✅ Notifications created:', { notification1: notification1.id });

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

