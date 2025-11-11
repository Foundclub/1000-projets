import 'dotenv/config';
import { PrismaClient, Role, Space, MissionStatus, SubmissionStatus, ApplicationStatus, MessageType, ReportKind, ReportStatus, FollowTargetType, FeedPrivacy, FeedPrivacyOverride } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

// Listes de prénoms et noms français courants
const PRENOMS = [
  'Alexandre', 'Antoine', 'Baptiste', 'Benjamin', 'Camille', 'Clément', 'David', 'Élise', 'Emma', 'Florian',
  'Gabriel', 'Hugo', 'Julien', 'Léa', 'Lucas', 'Marie', 'Mathieu', 'Nicolas', 'Paul', 'Pierre',
  'Sophie', 'Thomas', 'Valentin', 'Vincent', 'Adrien', 'Amélie', 'Arthur', 'Aurélie', 'Benoît', 'Céline',
  'Charlotte', 'Clara', 'Diane', 'Émilie', 'François', 'Guillaume', 'Isabelle', 'Jérôme', 'Julie', 'Laurent',
  'Manon', 'Marc', 'Marion', 'Maxime', 'Nathalie', 'Olivier', 'Romain', 'Sandra', 'Sébastien', 'Stéphane'
];

const NOMS = [
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
  'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
  'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Blanc', 'Guerin',
  'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clement'
];

const COMPANY_NAMES = [
  'TechCorp', 'InnovateLab', 'Digital Solutions', 'Cloud Services', 'Web Agency', 'StartupHub', 'DevStudio',
  'CodeFactory', 'AppBuilder', 'Software Inc', 'DataFlow', 'NetServices', 'CyberTech', 'MobileFirst',
  'AgileDev', 'FutureTech', 'SmartApps', 'CodeCraft', 'DevOps Pro', 'TechFlow'
];

const ORGANIZATION_NAMES = [
  'Netflix', 'FoundClub', 'TechStartup', 'CodeAcademy', 'DevCommunity', 'TechHub', 'InnovationLab',
  'DigitalClub', 'WebMasters', 'AppBuilders', 'CodeMasters', 'TechLeaders', 'DevNetwork', 'StartupZone',
  'TechInnovators', 'CodeCollective', 'DevAcademy', 'TechForge', 'CodeWorks', 'DevSpace'
];

const ORGANIZATION_SLUGS = [
  'netflix', 'foundclub', 'tech-startup', 'code-academy', 'dev-community', 'tech-hub', 'innovation-lab',
  'digital-club', 'web-masters', 'app-builders', 'code-masters', 'tech-leaders', 'dev-network', 'startup-zone',
  'tech-innovators', 'code-collective', 'dev-academy', 'tech-forge', 'code-works', 'dev-space'
];

const MISSION_TITLES_PRO = [
  'Développement API REST complète',
  'Application Mobile React Native',
  'Site E-commerce avec paiement',
  'Dashboard Analytics en temps réel',
  'Système de gestion de base de données',
  'Application Web Progressive (PWA)',
  'Intégration API tierces',
  'Système de notifications push',
  'Plateforme de streaming vidéo',
  'Application de gestion de projet',
  'Système de réservation en ligne',
  'Plateforme de e-learning',
  'Application de gestion financière',
  'Système de chat en temps réel',
  'Plateforme de marketplace',
  'Application de gestion de stock',
  'Système de facturation automatique',
  'Plateforme de recrutement',
  'Application de gestion d\'événements',
  'Système de CRM personnalisé'
];

const MISSION_TITLES_SOLIDAIRE = [
  'Site web pour association caritative',
  'Application mobile pour bénévoles',
  'Plateforme de don en ligne',
  'Système de gestion de bénévolat',
  'Site web pour ONG locale',
  'Application de coordination d\'aide',
  'Plateforme de partage de ressources',
  'Système de suivi de projets sociaux',
  'Application de sensibilisation',
  'Site web pour collectif citoyen',
  'Plateforme de solidarité locale',
  'Système de gestion de collectes',
  'Application de mise en relation',
  'Site web pour fondation',
  'Plateforme de bénévolat en ligne'
];

const MISSION_DESCRIPTIONS = [
  'Créer une solution complète et moderne avec une architecture scalable.',
  'Développer une application performante et intuitive pour les utilisateurs.',
  'Implémenter les meilleures pratiques de développement et de sécurité.',
  'Créer une expérience utilisateur exceptionnelle avec un design moderne.',
  'Développer une solution robuste et maintenable pour le long terme.',
  'Implémenter des fonctionnalités avancées avec une attention aux détails.',
  'Créer une plateforme innovante qui répond aux besoins des utilisateurs.',
  'Développer une solution complète avec documentation et tests.',
  'Implémenter une architecture moderne et évolutive.',
  'Créer une application performante avec une excellente UX.'
];

const MISSION_CRITERIA = [
  'Code source sur GitHub, tests unitaires > 80%, documentation complète.',
  'Déploiement sur Vercel/Railway, code propre et commenté.',
  'Tests d\'intégration, accessibilité WCAG AA, responsive design.',
  'Performance optimisée, sécurité renforcée, documentation API.',
  'Code review, CI/CD configuré, monitoring en place.',
  'Architecture scalable, base de données optimisée, cache implémenté.',
  'Interface utilisateur moderne, expérience fluide, design responsive.',
  'Documentation technique complète, guide d\'installation, README détaillé.',
  'Tests automatisés, couverture de code > 70%, déploiement automatisé.',
  'Sécurité des données, authentification robuste, validation des entrées.'
];

const REWARD_TEXTS = [
  '100€ + Badge spécial',
  '150€',
  '200€ + Certification',
  'Badge "Expert"',
  '50€ + Badge',
  '300€',
  'Badge "Champion"',
  '100€',
  'Badge "Maître"',
  '250€ + Badge premium'
];

// Configuration Supabase
// Récupérer l'URL Supabase depuis les variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igoryzxejxbvsuuuglyx.supabase.co';

// Fonction pour construire une URL publique Supabase Storage
function getSupabasePublicUrl(path: string, bucket: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Images d'exemple disponibles dans Supabase Storage
const AVATAR_IMAGES = [
  'avatar1.avif',
  'avatar2.jpeg',
  'avatar3.jpg',
  'avatar4.webp',
  'avatar5.avif',
  'avatar6.jpg',
  'avatar7.webp',
  'avatar8.jpg',
  'avatar9.avif',
  'avatar10.jpg',
  'clean my calanques.jpeg',
  'entreprise tech 1.jpeg',
  'la croix rouge.png',
  'Secours_populaire.png',
];

// Templates d'images par défaut (fallback si aucune image Supabase)
const DEFAULT_AVATAR = '/templates/default-avatar.svg';
const DEFAULT_MISSION_PRO = '/templates/default-mission-pro.svg';
const DEFAULT_MISSION_SOLIDAIRE = '/templates/default-mission-solidaire.svg';
const DEFAULT_ORGANIZATION = '/templates/default-organization.svg';
const DEFAULT_PROOF = '/templates/default-proof.svg';
const DEFAULT_REWARD = '/templates/default-reward.svg';

// Fonction pour obtenir une image d'avatar aléatoire depuis Supabase
function getRandomAvatarImage(): string | null {
  if (AVATAR_IMAGES.length === 0) return null;
  const randomImage = randomChoice(AVATAR_IMAGES);
  return getSupabasePublicUrl(randomImage, 'avatars');
}

// Fonctions utilitaires
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateRandomName(): { firstName: string; lastName: string } {
  return {
    firstName: randomChoice(PRENOMS),
    lastName: randomChoice(NOMS)
  };
}

function generateRandomEmail(firstName: string, lastName: string, role?: string): string {
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const suffix = role ? `+${role.toLowerCase()}` : '';
  const number = randomInt(1, 999);
  return `${base}${suffix}${number}@example.com`;
}

function generateRandomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - startDaysAgo);
  const end = new Date(now);
  end.setDate(end.getDate() - endDaysAgo);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

function generateDateOfBirth(): Date {
  const now = new Date();
  const age = randomInt(18, 65);
  const birthDate = new Date(now);
  birthDate.setFullYear(birthDate.getFullYear() - age);
  birthDate.setMonth(randomInt(0, 11));
  birthDate.setDate(randomInt(1, 28));
  return birthDate;
}

function generatePhone(): string {
  return `+33 6 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`;
}

function generateBio(): string {
  const bios = [
    'Passionné par les nouvelles technologies et l\'innovation.',
    'Expert en développement web et mobile avec 10 ans d\'expérience.',
    'Entrepreneur dans le domaine du digital et de la tech.',
    'Développeur full-stack spécialisé en React et Node.js.',
    'Créateur de solutions innovantes pour les entreprises.',
    'Consultant en transformation digitale et développement logiciel.',
    'Fondateur de plusieurs startups technologiques.',
    'Expert en architecture logicielle et développement agile.',
    'Passionné par l\'open source et les technologies émergentes.',
    'Développeur passionné par la création de produits innovants.'
  ];
  return randomChoice(bios);
}

function generateActivities(): string {
  const activities = [
    'Développement web, applications mobiles, consulting',
    'Tech startup, innovation, développement logiciel',
    'Digital transformation, web development, mobile apps',
    'Software engineering, cloud computing, DevOps',
    'Full-stack development, UI/UX design, product management',
    'Web development, mobile apps, digital marketing',
    'Software development, tech consulting, innovation',
    'Application development, cloud services, tech solutions',
    'Web & mobile development, digital strategy, consulting',
    'Tech innovation, software development, digital products'
  ];
  return randomChoice(activities);
}

function generateWebsite(companyName: string): string {
  const domain = companyName.toLowerCase().replace(/\s+/g, '-');
  return `https://${domain}.com`;
}

function generateOrganizationBio(): string {
  const bios = [
    'Un club de développeurs passionnés par les nouvelles technologies.',
    'Une communauté active de professionnels du digital.',
    'Un espace d\'échange et de collaboration pour les tech enthusiasts.',
    'Une organisation dédiée à l\'innovation et au développement technologique.',
    'Un collectif de développeurs et entrepreneurs dans le domaine tech.',
    'Une communauté de professionnels partageant leur passion pour la tech.',
    'Un espace de networking et de développement professionnel.',
    'Une organisation promouvant l\'innovation et l\'excellence technique.',
    'Un club de développeurs et créateurs de solutions innovantes.',
    'Une communauté active dans le domaine du développement logiciel.'
  ];
  return randomChoice(bios);
}

function generateMissionDescription(space: Space): string {
  if (space === Space.PRO) {
    return randomChoice(MISSION_DESCRIPTIONS);
  } else {
    return 'Créer une solution pour aider une association ou une organisation à but non lucratif.';
  }
}

function generateMissionCriteria(space: Space): string {
  if (space === Space.PRO) {
    return randomChoice(MISSION_CRITERIA);
  } else {
    return 'Site responsive (mobile-first), accessibilité WCAG AA, hébergement gratuit (Netlify/Vercel), code source open source sur GitHub.';
  }
}

function generateMessageContent(type: MessageType): string {
  switch (type) {
    case MessageType.TEXT:
      const messages = [
        'Bonjour, je suis intéressé par cette mission.',
        'Merci pour votre réponse rapide.',
        'J\'ai une question concernant les critères de validation.',
        'Parfait, je vais commencer dès que possible.',
        'Merci pour cette opportunité !',
        'J\'ai terminé la première partie, pouvez-vous me donner votre avis ?',
        'Excellent, je continue sur cette base.',
        'Merci pour vos retours, je vais les intégrer.',
        'La mission est terminée, j\'attends votre validation.',
        'Parfait, merci pour tout !'
      ];
      return randomChoice(messages);
    case MessageType.FILE:
      return 'FILE:https://example.com/file.pdf';
    case MessageType.CODE:
      return 'CODE:const example = "code snippet";';
    case MessageType.REWARD:
      return 'REWARD_MEDIA_URL:https://example.com/reward.jpg';
    default:
      return '';
  }
}

function generateCommentText(): string {
  const comments = [
    'Excellent travail !',
    'Très impressionnant, bravo !',
    'Super réalisation, continuez comme ça !',
    'Félicitations pour ce projet !',
    'Très bien fait, j\'adore !',
    'Impressionnant, bravo pour cette réalisation !',
    'Excellent projet, continuez !',
    'Super travail, félicitations !',
    'Très beau projet, bravo !',
    'Impressionnant, excellent travail !'
  ];
  return randomChoice(comments);
}

function generateFeedPostText(): string {
  const texts = [
    'Mission terminée avec succès ! Merci pour cette opportunité.',
    'Fier d\'avoir complété cette mission. Expérience enrichissante !',
    'Mission accomplie ! Merci à tous ceux qui m\'ont soutenu.',
    'Super expérience, merci pour cette mission !',
    'Mission terminée, très content du résultat !',
    'Merci pour cette opportunité, mission complétée avec succès !',
    'Fier de partager cette réalisation avec vous tous !',
    'Mission accomplie, merci pour votre confiance !',
    'Super projet, merci pour cette expérience !',
    'Mission terminée, très satisfait du résultat final !'
  ];
  return randomChoice(texts);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

interface SeedConfig {
  clean: boolean;
  countAdmins: number;
  countAnnonceurs: number;
  countMissionnaires: number;
  countOrganizations: number;
  countMissions: number;
}

const DEFAULT_CONFIG: SeedConfig = {
  clean: false,
  countAdmins: 5,
  countAnnonceurs: 25,
  countMissionnaires: 30,
  countOrganizations: 20,
  countMissions: 60
};

function parseArgs(): SeedConfig {
  // Récupérer tous les arguments (y compris ceux après --)
  const allArgs = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  // Vérifier le flag --clean
  // Quand on utilise npm run script -- --flag, les arguments après -- sont passés dans process.argv
  // Mais tsx peut aussi les passer différemment
  const hasCleanFlag = allArgs.includes('--clean') || 
                       process.argv.includes('--clean');
  
  if (hasCleanFlag) {
    config.clean = true;
  }
  
  const args = allArgs;
  
  const countUsersIndex = args.indexOf('--count-users');
  if (countUsersIndex !== -1 && args[countUsersIndex + 1]) {
    const count = parseInt(args[countUsersIndex + 1]);
    if (!isNaN(count)) {
      config.countAnnonceurs = Math.floor(count * 0.5);
      config.countMissionnaires = Math.floor(count * 0.6);
      config.countAdmins = Math.floor(count * 0.1);
    }
  }
  
  const countMissionsIndex = args.indexOf('--count-missions');
  if (countMissionsIndex !== -1 && args[countMissionsIndex + 1]) {
    const count = parseInt(args[countMissionsIndex + 1]);
    if (!isNaN(count)) {
      config.countMissions = count;
    }
  }
  
  return config;
}

// ============================================================================
// FONCTIONS DE CRÉATION
// ============================================================================

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  
  // Supprimer dans l'ordre inverse des dépendances
  await prisma.feedComment.deleteMany();
  await prisma.feedLike.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.report.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.missionApplication.deleteMany();
  await prisma.xpEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favoriteAnnonceur.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Base de données nettoyée');
}

async function createUsers(config: SeedConfig) {
  console.log('\n👥 Création des utilisateurs...');
  
  const users = {
    admins: [] as any[],
    annonceurs: [] as any[],
    missionnaires: [] as any[]
  };
  
  // Créer les admins
  console.log(`  📋 Création de ${config.countAdmins} admins...`);
  for (let i = 0; i < config.countAdmins; i++) {
    const { firstName, lastName } = generateRandomName();
    const email = generateRandomEmail(firstName, lastName, 'admin');
    const activeRole = Math.random() > 0.3 ? Role.ADMIN : Role.MISSIONNAIRE;
    
    const admin = await prisma.user.create({
      data: {
        email,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: Role.ADMIN,
        activeRole,
        roleChosenAt: generateRandomDate(365, 30),
        phone: generatePhone(),
        xp: randomInt(0, 50000),
        xpPro: randomInt(0, 30000),
        xpSolid: randomInt(0, 20000)
      }
    });
    users.admins.push(admin);
  }
  console.log(`  ✅ ${users.admins.length} admins créés`);
  
  // Créer les annonceurs
  console.log(`  📋 Création de ${config.countAnnonceurs} annonceurs...`);
  for (let i = 0; i < config.countAnnonceurs; i++) {
    const { firstName, lastName } = generateRandomName();
    const email = generateRandomEmail(firstName, lastName, 'annonceur');
    const isCertified = Math.random() < 0.6;
    const annonceurRequestStatus = Math.random() < 0.7 ? 'APPROVED' : Math.random() < 0.5 ? 'PENDING' : 'REJECTED';
    const ratingCount = randomInt(0, 50);
    const ratingAvg = ratingCount > 0 ? randomFloat(3.5, 5.0) : 0;
    
    // Utiliser une vraie image Supabase ou un template par défaut
    const hasAvatar = Math.random() < 0.7; // 70% des annonceurs ont un avatar
    const avatar = hasAvatar ? getRandomAvatarImage() : DEFAULT_AVATAR;
    
    const annonceur = await prisma.user.create({
      data: {
        email,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: Role.ANNONCEUR,
        activeRole: Role.ANNONCEUR,
        roleChosenAt: generateRandomDate(365, 30),
        companyName: randomChoice(COMPANY_NAMES),
        bio: generateBio(),
        activities: generateActivities(),
        website: generateWebsite(randomChoice(COMPANY_NAMES)),
        isCertifiedAnnonceur: isCertified,
        annonceurRequestStatus,
        ratingAvg,
        ratingCount,
        avatar,
        xp: randomInt(0, 30000),
        xpPro: randomInt(0, 20000),
        xpSolid: randomInt(0, 10000)
      }
    });
    users.annonceurs.push(annonceur);
  }
  console.log(`  ✅ ${users.annonceurs.length} annonceurs créés`);
  
  // Créer les missionnaires
  console.log(`  📋 Création de ${config.countMissionnaires} missionnaires...`);
  for (let i = 0; i < config.countMissionnaires; i++) {
    const { firstName, lastName } = generateRandomName();
    const email = generateRandomEmail(firstName, lastName);
    const feedPrivacyDefault = randomChoice([FeedPrivacy.AUTO, FeedPrivacy.ASK, FeedPrivacy.NEVER]);
    const hasLastAccepted = Math.random() < 0.6;
    
    // Utiliser une vraie image Supabase ou un template par défaut
    const hasAvatar = Math.random() < 0.6; // 60% des missionnaires ont un avatar
    const avatar = hasAvatar ? getRandomAvatarImage() : DEFAULT_AVATAR;
    
    const missionnaire = await prisma.user.create({
      data: {
        email,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: Role.MISSIONNAIRE,
        activeRole: Role.MISSIONNAIRE,
        roleChosenAt: generateRandomDate(365, 30),
        dateOfBirth: generateDateOfBirth(),
        feedPrivacyDefault,
        avatar,
        lastAcceptedAt: hasLastAccepted ? generateRandomDate(90, 1) : null,
        xp: randomInt(0, 40000),
        xpPro: randomInt(0, 25000),
        xpSolid: randomInt(0, 15000)
      }
    });
    users.missionnaires.push(missionnaire);
  }
  console.log(`  ✅ ${users.missionnaires.length} missionnaires créés`);
  
  return users;
}

async function createOrganizations(annonceurs: any[], config: SeedConfig) {
  console.log('\n🏢 Création des organisations...');
  
  const organizations = [];
  const usedSlugs = new Set<string>();
  
  for (let i = 0; i < config.countOrganizations && i < ORGANIZATION_SLUGS.length; i++) {
    const slug = ORGANIZATION_SLUGS[i];
    if (usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);
    
    const owner = randomChoice(annonceurs);
    const isCertified = Math.random() < 0.5;
    const ratingCount = randomInt(0, 100);
    const ratingAvg = ratingCount > 0 ? randomFloat(3.5, 5.0) : 0;
    
    // Utiliser un template par défaut pour le logo si aucun logo n'est fourni
    const hasLogo = Math.random() < 0.5; // 50% des organisations ont un logo
    const logoUrl = hasLogo ? null : DEFAULT_ORGANIZATION;
    
    // Utiliser upsert pour éviter les erreurs de contrainte unique
    const org = await prisma.organization.upsert({
      where: { slug },
      update: {
        name: ORGANIZATION_NAMES[i],
        bio: generateOrganizationBio(),
        website: generateWebsite(ORGANIZATION_NAMES[i]),
        logoUrl,
        isCertified,
        ratingAvg,
        ratingCount,
        ownerId: owner.id
      },
      create: {
        slug,
        name: ORGANIZATION_NAMES[i],
        bio: generateOrganizationBio(),
        website: generateWebsite(ORGANIZATION_NAMES[i]),
        logoUrl,
        isCertified,
        ratingAvg,
        ratingCount,
        ownerId: owner.id
      }
    });
    organizations.push(org);
  }
  
  console.log(`  ✅ ${organizations.length} organisations créées`);
  return organizations;
}

async function createMissions(annonceurs: any[], organizations: any[], config: SeedConfig) {
  console.log('\n🎯 Création des missions...');
  
  const missions = [];
  const openMissions = [];
  
  for (let i = 0; i < config.countMissions; i++) {
    const space = Math.random() < 0.6 ? Space.PRO : Space.SOLIDAIRE;
    const title = space === Space.PRO 
      ? randomChoice(MISSION_TITLES_PRO)
      : randomChoice(MISSION_TITLES_SOLIDAIRE);
    const owner = randomChoice(annonceurs);
    const hasOrganization = Math.random() < 0.7 && organizations.length > 0;
    const organization = hasOrganization ? randomChoice(organizations) : null;
    
    // Statuts : OPEN (70%), CLOSED (20%), ARCHIVED (10%)
    const statusRand = Math.random();
    let status: MissionStatus;
    if (statusRand < 0.7) {
      status = MissionStatus.OPEN;
    } else if (statusRand < 0.9) {
      status = MissionStatus.CLOSED;
    } else {
      status = MissionStatus.ARCHIVED;
    }
    
    const isFeatured = Math.random() < 0.2 && status === MissionStatus.OPEN;
    const featuredRank = isFeatured ? randomInt(1, 10) : null;
    const slotsMax = randomInt(1, 10);
    const slotsTaken = status === MissionStatus.CLOSED ? slotsMax : randomInt(0, Math.floor(slotsMax * 0.7));
    const baseXp = randomInt(300, 1000);
    const bonusXp = Math.random() < 0.3 ? randomInt(0, 500) : 0;
    
    // Utiliser un template par défaut pour l'image si aucune image n'est fournie
    const hasImage = Math.random() < 0.7; // 70% des missions ont une image
    const imageUrl = hasImage ? null : (space === Space.PRO ? DEFAULT_MISSION_PRO : DEFAULT_MISSION_SOLIDAIRE);
    
    const mission = await prisma.mission.create({
      data: {
        title: `${title} ${i + 1}`,
        space,
        description: generateMissionDescription(space),
        criteria: generateMissionCriteria(space),
        slotsMax,
        slotsTaken,
        slaDecisionH: randomInt(24, 72),
        slaRewardH: randomInt(48, 96),
        ownerId: owner.id,
        organizationId: organization?.id || null,
        status,
        isFeatured,
        featuredRank,
        baseXp,
        bonusXp,
        rewardText: randomChoice(REWARD_TEXTS),
        rewardEscrowContent: Math.random() < 0.3 ? 'CODE_PROMO_2024' : null,
        imageUrl,
        createdAt: generateRandomDate(180, 1)
      }
    });
    
    missions.push(mission);
    if (status === MissionStatus.OPEN) {
      openMissions.push(mission);
    }
  }
  
  console.log(`  ✅ ${missions.length} missions créées (${openMissions.length} ouvertes)`);
  return { missions, openMissions };
}

async function createApplications(missionnaires: any[], openMissions: any[]) {
  console.log('\n📝 Création des applications...');
  
  const applications = [];
  const acceptedApplications = [];
  const applicationThreads = [];
  
  // Créer 100-150 applications
  const count = randomInt(100, 150);
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < count && i < openMissions.length * 3; i++) {
    const mission = randomChoice(openMissions);
    const missionnaire = randomChoice(missionnaires);
    const pairKey = `${mission.id}-${missionnaire.id}`;
    
    // Éviter les doublons (contrainte unique)
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);
    
    // Statuts : PENDING (40%), ACCEPTED (40%), REJECTED (20%)
    const statusRand = Math.random();
    let status: ApplicationStatus;
    if (statusRand < 0.4) {
      status = ApplicationStatus.PENDING;
    } else if (statusRand < 0.8) {
      status = ApplicationStatus.ACCEPTED;
    } else {
      status = ApplicationStatus.REJECTED;
    }
    
    const hasMessage = Math.random() < 0.6;
    const message = hasMessage ? 'Je suis très intéressé par cette mission et j\'ai l\'expérience nécessaire.' : null;
    
    const application = await prisma.missionApplication.create({
      data: {
        missionId: mission.id,
        userId: missionnaire.id,
        status,
        message,
        createdAt: generateRandomDate(90, 1)
      }
    });
    
    applications.push(application);
    
    // Créer un thread pour les applications ACCEPTED
    if (status === ApplicationStatus.ACCEPTED) {
      const missionData = await prisma.mission.findUnique({ where: { id: mission.id }, select: { ownerId: true } });
      if (missionData) {
        const thread = await prisma.thread.create({
          data: {
            applicationId: application.id,
            aId: missionData.ownerId, // Annonceur
            bId: missionnaire.id, // Missionnaire
            createdAt: application.createdAt
          }
        });
        applicationThreads.push(thread);
        acceptedApplications.push({ application, mission, missionnaire });
      }
    }
  }
  
  console.log(`  ✅ ${applications.length} applications créées (${acceptedApplications.length} acceptées, ${applicationThreads.length} threads)`);
  return { applications, acceptedApplications, applicationThreads };
}

async function createSubmissions(acceptedApplications: any[]) {
  console.log('\n📤 Création des soumissions...');
  
  const submissions = [];
  const acceptedSubmissions = [];
  const submissionThreads = [];
  
  // Créer 80-120 soumissions
  const count = randomInt(80, 120);
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < count && i < acceptedApplications.length; i++) {
    const { application, mission, missionnaire } = randomChoice(acceptedApplications);
    const pairKey = `${mission.id}-${missionnaire.id}`;
    
    // Éviter les doublons
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);
    
    // Statuts : PENDING (30%), ACCEPTED (50%), REFUSED (20%)
    const statusRand = Math.random();
    let status: SubmissionStatus;
    if (statusRand < 0.3) {
      status = SubmissionStatus.PENDING;
    } else if (statusRand < 0.8) {
      status = SubmissionStatus.ACCEPTED;
    } else {
      status = SubmissionStatus.REFUSED;
    }
    
    const proofShotsCount = randomInt(0, 3);
    const proofShots = proofShotsCount > 0 
      ? Array.from({ length: proofShotsCount }, (_, i) => DEFAULT_PROOF)
      : null;
    
    const hasComments = Math.random() < 0.5;
    const comments = hasComments ? 'Mission terminée avec succès. Voici les preuves demandées.' : null;
    
    const feedPrivacyOverride = randomChoice([FeedPrivacyOverride.INHERIT, FeedPrivacyOverride.AUTO, FeedPrivacyOverride.ASK, FeedPrivacyOverride.NEVER]);
    
    // Utiliser un template par défaut pour les preuves et récompenses
    const proofUrl = DEFAULT_PROOF;
    const rewardMediaUrl = status === SubmissionStatus.ACCEPTED && Math.random() < 0.3 
      ? DEFAULT_REWARD 
      : null;
    
    const submission = await prisma.submission.create({
      data: {
        missionId: mission.id,
        userId: missionnaire.id,
        proofUrl,
        proofShots: proofShots ? JSON.parse(JSON.stringify(proofShots)) : null,
        comments,
        status,
        reason: status === SubmissionStatus.REFUSED ? 'Preuves insuffisantes' : null,
        rewardDeliveredAt: status === SubmissionStatus.ACCEPTED && Math.random() < 0.6 
          ? generateRandomDate(30, 1) 
          : null,
        rewardNote: status === SubmissionStatus.ACCEPTED && Math.random() < 0.4 
          ? 'Code promo envoyé par email' 
          : null,
        rewardMediaUrl,
        feedPrivacyOverride,
        createdAt: generateRandomDate(60, 1),
        decisionAt: status !== SubmissionStatus.PENDING ? generateRandomDate(30, 1) : null
      }
    });
    
    submissions.push(submission);
    
    // Créer un thread pour les soumissions ACCEPTED
    if (status === SubmissionStatus.ACCEPTED) {
      const missionData = await prisma.mission.findUnique({ where: { id: mission.id }, select: { ownerId: true } });
      if (missionData) {
        const thread = await prisma.thread.create({
          data: {
            submissionId: submission.id,
            aId: missionData.ownerId, // Annonceur
            bId: missionnaire.id, // Missionnaire
            createdAt: submission.createdAt
          }
        });
        submissionThreads.push(thread);
        acceptedSubmissions.push({ submission, mission, missionnaire });
      }
    }
  }
  
  console.log(`  ✅ ${submissions.length} soumissions créées (${acceptedSubmissions.length} acceptées, ${submissionThreads.length} threads)`);
  return { submissions, acceptedSubmissions, submissionThreads };
}

async function createMessages(threads: any[]) {
  console.log('\n💬 Création des messages...');
  
  const messages = [];
  const messageCount = randomInt(200, 300);
  
  for (let i = 0; i < messageCount && i < threads.length * 5; i++) {
    const thread = randomChoice(threads);
    
    // Types : TEXT (80%), FILE (10%), CODE (5%), REWARD (5%)
    const typeRand = Math.random();
    let type: MessageType;
    if (typeRand < 0.8) {
      type = MessageType.TEXT;
    } else if (typeRand < 0.9) {
      type = MessageType.FILE;
    } else if (typeRand < 0.95) {
      type = MessageType.CODE;
    } else {
      type = MessageType.REWARD;
    }
    
    // Alterner entre annonceur et missionnaire
    const authorId = Math.random() < 0.5 ? thread.aId : thread.bId;
    
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        authorId,
        type,
        content: generateMessageContent(type),
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    messages.push(message);
  }
  
  console.log(`  ✅ ${messages.length} messages créés`);
  return messages;
}

async function createNotifications(users: any, missions: any[], applications: any[], submissions: any[]) {
  console.log('\n🔔 Création des notifications...');
  
  const notifications = [];
  const notificationCount = randomInt(150, 200);
  const allUsers = [...users.admins, ...users.annonceurs, ...users.missionnaires];
  
  const notificationTypes = [
    { type: 'NEW_MISSION', weight: 0.3 },
    { type: 'NEW_APPLICATION', weight: 0.2 },
    { type: 'APPLICATION_ACCEPTED', weight: 0.075 },
    { type: 'APPLICATION_REJECTED', weight: 0.075 },
    { type: 'SUBMISSION_ACCEPTED', weight: 0.075 },
    { type: 'SUBMISSION_REJECTED', weight: 0.075 },
    { type: 'NEW_MESSAGE', weight: 0.1 },
    { type: 'FEED_POST_COMMENTED', weight: 0.05 },
    { type: 'FEED_POST_PUBLISHED', weight: 0.05 }
  ];
  
  for (let i = 0; i < notificationCount; i++) {
    const user = randomChoice(allUsers);
    const rand = Math.random();
    let selectedType = notificationTypes[0].type;
    let cumulative = 0;
    
    for (const nt of notificationTypes) {
      cumulative += nt.weight;
      if (rand < cumulative) {
        selectedType = nt.type;
        break;
      }
    }
    
    let payload: any = {};
    
    switch (selectedType) {
      case 'NEW_MISSION':
        if (missions.length > 0) {
          const mission = randomChoice(missions);
          payload = {
            missionId: mission.id,
            missionTitle: mission.title,
            organizationId: mission.organizationId
          };
        } else continue;
        break;
      case 'NEW_APPLICATION':
        if (applications.length > 0) {
          const app = randomChoice(applications);
          const appData = await prisma.missionApplication.findUnique({
            where: { id: app.id },
            include: { mission: true, user: true }
          });
          if (appData) {
            payload = {
              missionId: appData.missionId,
              missionTitle: appData.mission.title,
              applicantName: appData.user.displayName || appData.user.firstName
            };
          } else continue;
        } else continue;
        break;
      case 'APPLICATION_ACCEPTED':
      case 'APPLICATION_REJECTED':
        const acceptedApps = applications.filter((a: any) => a.status === (selectedType === 'APPLICATION_ACCEPTED' ? 'ACCEPTED' : 'REJECTED'));
        if (acceptedApps.length > 0) {
          const app = randomChoice(acceptedApps);
          const appData = await prisma.missionApplication.findUnique({
            where: { id: app.id },
            include: { mission: true }
          });
          if (appData) {
            payload = {
              missionId: appData.missionId,
              missionTitle: appData.mission.title
            };
          } else continue;
        } else continue;
        break;
      case 'SUBMISSION_ACCEPTED':
      case 'SUBMISSION_REJECTED':
        const acceptedSubs = submissions.filter((s: any) => s.status === (selectedType === 'SUBMISSION_ACCEPTED' ? 'ACCEPTED' : 'REFUSED'));
        if (acceptedSubs.length > 0) {
          const sub = randomChoice(acceptedSubs);
          const subData = await prisma.submission.findUnique({
            where: { id: sub.id },
            include: { mission: true }
          });
          if (subData) {
            payload = {
              missionId: subData.missionId,
              missionTitle: subData.mission.title
            };
          } else continue;
        } else continue;
        break;
      case 'NEW_MESSAGE':
        payload = {
          threadId: `thread-${randomInt(1, 1000)}`,
          senderName: randomChoice(allUsers).displayName || 'Utilisateur'
        };
        break;
      case 'FEED_POST_COMMENTED':
      case 'FEED_POST_PUBLISHED':
        payload = {
          postId: `post-${randomInt(1, 1000)}`,
          commenterName: randomChoice(allUsers).displayName || 'Utilisateur'
        };
        break;
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: selectedType,
        payload: JSON.parse(JSON.stringify(payload)),
        read: Math.random() < 0.4, // 60% non lues
        createdAt: generateRandomDate(90, 1)
      }
    });
    
    notifications.push(notification);
  }
  
  console.log(`  ✅ ${notifications.length} notifications créées`);
  return notifications;
}

async function createRatings(missionnaires: any[], annonceurs: any[], acceptedSubmissions: any[]) {
  console.log('\n⭐ Création des ratings...');
  
  const ratings = [];
  const ratingCount = randomInt(50, 80);
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < ratingCount && i < acceptedSubmissions.length; i++) {
    const { submission, mission, missionnaire } = randomChoice(acceptedSubmissions);
    const missionData = await prisma.mission.findUnique({
      where: { id: mission.id },
      select: { ownerId: true }
    });
    
    if (!missionData) continue;
    
    const annonceur = annonceurs.find((a: any) => a.id === missionData.ownerId);
    if (!annonceur) continue;
    
    const pairKey = `${missionnaire.id}-${mission.id}`;
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);
    
    // Distribution réaliste : plus de 4-5 étoiles que 1-2
    const scoreRand = Math.random();
    let score: number;
    if (scoreRand < 0.1) {
      score = 1;
    } else if (scoreRand < 0.2) {
      score = 2;
    } else if (scoreRand < 0.3) {
      score = 3;
    } else if (scoreRand < 0.6) {
      score = 4;
    } else {
      score = 5;
    }
    
    const hasComment = Math.random() < 0.6;
    const comment = hasComment ? `Excellent travail, très professionnel !` : null;
    
    const rating = await prisma.rating.create({
      data: {
        annonceurId: annonceur.id,
        raterId: missionnaire.id,
        missionId: mission.id,
        submissionId: submission.id,
        score,
        comment,
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    ratings.push(rating);
  }
  
  // Mettre à jour les ratings des annonceurs
  for (const annonceur of annonceurs) {
    const annonceurRatings = ratings.filter((r: any) => r.annonceurId === annonceur.id);
    if (annonceurRatings.length > 0) {
      const avg = annonceurRatings.reduce((sum: number, r: any) => sum + r.score, 0) / annonceurRatings.length;
      await prisma.user.update({
        where: { id: annonceur.id },
        data: {
          ratingAvg: Math.round(avg * 10) / 10,
          ratingCount: annonceurRatings.length
        }
      });
    }
  }
  
  console.log(`  ✅ ${ratings.length} ratings créés`);
  return ratings;
}

async function createFollows(missionnaires: any[], organizations: any[], allUsers: any[]) {
  console.log('\n👥 Création des follows...');
  
  const follows = [];
  const followCount = randomInt(100, 150);
  const usedPairs = new Set<string>();
  const userFollowCounts = new Map<string, number>();
  
  for (let i = 0; i < followCount; i++) {
    const follower = randomChoice([...missionnaires, ...allUsers]);
    const currentCount = userFollowCounts.get(follower.id) || 0;
    
    // Limite de 50 follows par utilisateur
    if (currentCount >= 50) continue;
    
    // 70% ORGANIZATION, 30% USER
    const isOrganization = Math.random() < 0.7;
    
    if (isOrganization && organizations.length > 0) {
      const org = randomChoice(organizations);
      const pairKey = `${follower.id}-ORGANIZATION-${org.id}`;
      
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      const follow = await prisma.follow.create({
        data: {
          followerId: follower.id,
          targetType: FollowTargetType.ORGANIZATION,
          organizationId: org.id,
          createdAt: generateRandomDate(180, 1)
        }
      });
      
      follows.push(follow);
      userFollowCounts.set(follower.id, currentCount + 1);
    } else {
      const targetUser = randomChoice(allUsers.filter((u: any) => u.id !== follower.id));
      const pairKey = `${follower.id}-USER-${targetUser.id}`;
      
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      const follow = await prisma.follow.create({
        data: {
          followerId: follower.id,
          targetType: FollowTargetType.USER,
          targetUserId: targetUser.id,
          createdAt: generateRandomDate(180, 1)
        }
      });
      
      follows.push(follow);
      userFollowCounts.set(follower.id, currentCount + 1);
    }
  }
  
  console.log(`  ✅ ${follows.length} follows créés`);
  return follows;
}

async function createFavoriteAnnonceurs(missionnaires: any[], annonceurs: any[]) {
  console.log('\n❤️ Création des favoris annonceurs...');
  
  const favorites = [];
  const favoriteCount = randomInt(50, 80);
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < favoriteCount; i++) {
    const missionnaire = randomChoice(missionnaires);
    const annonceur = randomChoice(annonceurs);
    const pairKey = `${missionnaire.id}-${annonceur.id}`;
    
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);
    
    const favorite = await prisma.favoriteAnnonceur.create({
      data: {
        userId: missionnaire.id,
        annonceurId: annonceur.id,
        createdAt: generateRandomDate(180, 1)
      }
    });
    
    favorites.push(favorite);
  }
  
  console.log(`  ✅ ${favorites.length} favoris créés`);
  return favorites;
}

async function createFeedPosts(acceptedSubmissions: any[]) {
  console.log('\n📰 Création des feed posts...');
  
  const posts = [];
  const postCount = randomInt(40, 60);
  const usedSubmissions = new Set<string>();
  
  for (let i = 0; i < postCount && i < acceptedSubmissions.length; i++) {
    const { submission, mission, missionnaire } = randomChoice(acceptedSubmissions);
    
    if (usedSubmissions.has(submission.id)) continue;
    usedSubmissions.add(submission.id);
    
    // Récupérer la mission depuis la base pour obtenir l'espace
    const missionData = await prisma.mission.findUnique({
      where: { id: mission.id },
      select: { space: true }
    });
    
    if (!missionData) continue;
    
    const hasText = Math.random() < 0.7;
    const text = hasText ? generateFeedPostText() : null;
    const mediaUrlsCount = randomInt(0, 3);
    // Utiliser des templates par défaut pour les médias du feed
    const mediaUrls = mediaUrlsCount > 0 
      ? Array.from({ length: mediaUrlsCount }, (_, i) => missionData.space === Space.PRO ? DEFAULT_MISSION_PRO : DEFAULT_MISSION_SOLIDAIRE)
      : [];
    
    const post = await prisma.feedPost.create({
      data: {
        missionId: mission.id,
        submissionId: submission.id,
        authorId: missionnaire.id,
        space: missionData.space,
        text,
        mediaUrls,
        likeCount: randomInt(0, 50),
        commentCount: randomInt(0, 20),
        shareCount: randomInt(0, 10),
        published: true,
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    posts.push(post);
  }
  
  console.log(`  ✅ ${posts.length} feed posts créés`);
  return posts;
}

async function createFeedLikes(posts: any[], allUsers: any[]) {
  console.log('\n👍 Création des feed likes...');
  
  const likes = [];
  const likeCount = randomInt(100, 150);
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < likeCount; i++) {
    const post = randomChoice(posts);
    const user = randomChoice(allUsers);
    const pairKey = `${post.id}-${user.id}`;
    
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);
    
    const like = await prisma.feedLike.create({
      data: {
        postId: post.id,
        userId: user.id,
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    likes.push(like);
  }
  
  // Mettre à jour les likeCount des posts
  for (const post of posts) {
    const postLikes = likes.filter((l: any) => l.postId === post.id);
    if (postLikes.length > 0) {
      await prisma.feedPost.update({
        where: { id: post.id },
        data: { likeCount: postLikes.length }
      });
    }
  }
  
  console.log(`  ✅ ${likes.length} feed likes créés`);
  return likes;
}

async function createFeedComments(posts: any[], allUsers: any[]) {
  console.log('\n💬 Création des feed comments...');
  
  const comments = [];
  const commentCount = randomInt(80, 120);
  
  for (let i = 0; i < commentCount; i++) {
    const post = randomChoice(posts);
    const user = randomChoice(allUsers);
    
    const comment = await prisma.feedComment.create({
      data: {
        postId: post.id,
        userId: user.id,
        text: generateCommentText(),
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    comments.push(comment);
  }
  
  // Mettre à jour les commentCount des posts
  for (const post of posts) {
    const postComments = comments.filter((c: any) => c.postId === post.id);
    if (postComments.length > 0) {
      await prisma.feedPost.update({
        where: { id: post.id },
        data: { commentCount: postComments.length }
      });
    }
  }
  
  console.log(`  ✅ ${comments.length} feed comments créés`);
  return comments;
}

async function createXpEvents(allUsers: any[], missions: any[], acceptedSubmissions: any[]) {
  console.log('\n🎮 Création des XP events...');
  
  const events = [];
  const eventCount = randomInt(200, 300);
  
  for (let i = 0; i < eventCount; i++) {
    const user = randomChoice(allUsers);
    
    // Types : MISSION_ACCEPTED (60%), BONUS_ADMIN (10%), BONUS_MANUAL (5%), autres (25%)
    const typeRand = Math.random();
    let kind: string;
    let delta: number;
    let space: Space | null = null;
    let missionId: string | null = null;
    
    if (typeRand < 0.6 && acceptedSubmissions.length > 0) {
      kind = 'MISSION_ACCEPTED';
      const { submission, mission } = randomChoice(acceptedSubmissions);
      space = mission.space;
      missionId = mission.id;
      delta = mission.baseXp + (mission.bonusXp || 0);
    } else if (typeRand < 0.7) {
      kind = 'BONUS_ADMIN';
      delta = randomInt(100, 500);
      space = Math.random() < 0.5 ? Space.PRO : Space.SOLIDAIRE;
    } else if (typeRand < 0.75) {
      kind = 'BONUS_MANUAL';
      delta = randomInt(50, 200);
    } else {
      kind = 'OTHER';
      delta = randomInt(10, 100);
    }
    
    const event = await prisma.xpEvent.create({
      data: {
        userId: user.id,
        missionId,
        kind,
        delta,
        space,
        description: `XP event: ${kind}`,
        createdAt: generateRandomDate(180, 1)
      }
    });
    
    events.push(event);
  }
  
  // Mettre à jour les XP des utilisateurs
  for (const user of allUsers) {
    const userEvents = events.filter((e: any) => e.userId === user.id);
    let xp = 0;
    let xpPro = 0;
    let xpSolid = 0;
    
    for (const event of userEvents) {
      if (event.space === Space.PRO) {
        xpPro += event.delta;
      } else if (event.space === Space.SOLIDAIRE) {
        xpSolid += event.delta;
      } else {
        xp += event.delta;
      }
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { xp, xpPro, xpSolid }
    });
  }
  
  console.log(`  ✅ ${events.length} XP events créés`);
  return events;
}

async function createReports(submissions: any[]) {
  console.log('\n🚨 Création des reports...');
  
  const reports = [];
  const reportCount = randomInt(10, 20);
  
  for (let i = 0; i < reportCount && i < submissions.length; i++) {
    const submission = randomChoice(submissions);
    
    // Kinds : NO_REWARD (40%), INVALID_CODE (30%), ABUSE (20%), OTHER (10%)
    const kindRand = Math.random();
    let kind: ReportKind;
    if (kindRand < 0.4) {
      kind = ReportKind.NO_REWARD;
    } else if (kindRand < 0.7) {
      kind = ReportKind.INVALID_CODE;
    } else if (kindRand < 0.9) {
      kind = ReportKind.ABUSE;
    } else {
      kind = ReportKind.OTHER;
    }
    
    // Statuts : OPEN (60%), RESOLVED (30%), REJECTED (10%)
    const statusRand = Math.random();
    let status: ReportStatus;
    if (statusRand < 0.6) {
      status = ReportStatus.OPEN;
    } else if (statusRand < 0.9) {
      status = ReportStatus.RESOLVED;
    } else {
      status = ReportStatus.REJECTED;
    }
    
    const report = await prisma.report.create({
      data: {
        submissionId: submission.id,
        kind,
        status,
        details: `Report details for ${kind}`,
        createdAt: generateRandomDate(60, 1)
      }
    });
    
    reports.push(report);
  }
  
  console.log(`  ✅ ${reports.length} reports créés`);
  return reports;
}

async function main() {
  const config = parseArgs();
  const startTime = Date.now();
  
  console.log('🌱 Démarrage du seed avancé...');
  console.log(`📊 Configuration:`, config);
  console.log(`📋 Arguments reçus:`, process.argv.slice(2));
  console.log(`📋 process.argv complet:`, process.argv);
  
  try {
    if (config.clean) {
      await cleanDatabase();
    }
    
    // Créer les utilisateurs
    const users = await createUsers(config);
    
    // Créer les organisations
    const organizations = await createOrganizations(users.annonceurs, config);
    
    // Créer les missions
    const { missions, openMissions } = await createMissions(users.annonceurs, organizations, config);
    
    // Créer les applications
    const { applications, acceptedApplications, applicationThreads } = await createApplications(users.missionnaires, openMissions);
    
    // Créer les soumissions
    const { submissions, acceptedSubmissions, submissionThreads } = await createSubmissions(acceptedApplications);
    
    // Créer les messages
    const allThreads = [...applicationThreads, ...submissionThreads];
    const messages = await createMessages(allThreads);
    
    // Créer les notifications
    const allUsers = [...users.admins, ...users.annonceurs, ...users.missionnaires];
    const notifications = await createNotifications(users, missions, applications, submissions);
    
    // Créer les ratings
    const ratings = await createRatings(users.missionnaires, users.annonceurs, acceptedSubmissions);
    
    // Créer les follows
    const follows = await createFollows(users.missionnaires, organizations, allUsers);
    
    // Créer les favoris annonceurs
    const favorites = await createFavoriteAnnonceurs(users.missionnaires, users.annonceurs);
    
    // Créer les feed posts
    const feedPosts = await createFeedPosts(acceptedSubmissions);
    
    // Créer les feed likes
    const feedLikes = await createFeedLikes(feedPosts, allUsers);
    
    // Créer les feed comments
    const feedComments = await createFeedComments(feedPosts, allUsers);
    
    // Créer les XP events
    const xpEvents = await createXpEvents(allUsers, missions, acceptedSubmissions);
    
    // Créer les reports
    const reports = await createReports(submissions);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Seed terminé en ${duration}s`);
    console.log(`\n📊 Résumé:`);
    console.log(`  - Utilisateurs: ${allUsers.length} (${users.admins.length} admins, ${users.annonceurs.length} annonceurs, ${users.missionnaires.length} missionnaires)`);
    console.log(`  - Organisations: ${organizations.length}`);
    console.log(`  - Missions: ${missions.length} (${openMissions.length} ouvertes)`);
    console.log(`  - Applications: ${applications.length}`);
    console.log(`  - Soumissions: ${submissions.length}`);
    console.log(`  - Messages: ${messages.length}`);
    console.log(`  - Notifications: ${notifications.length}`);
    console.log(`  - Ratings: ${ratings.length}`);
    console.log(`  - Follows: ${follows.length}`);
    console.log(`  - Favoris: ${favorites.length}`);
    console.log(`  - Feed Posts: ${feedPosts.length}`);
    console.log(`  - Feed Likes: ${feedLikes.length}`);
    console.log(`  - Feed Comments: ${feedComments.length}`);
    console.log(`  - XP Events: ${xpEvents.length}`);
    console.log(`  - Reports: ${reports.length}`);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  });

