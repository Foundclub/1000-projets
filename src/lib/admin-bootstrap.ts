import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

/**
 * Vérifie si le bootstrap admin est activé (ADMIN_EMAILS non vide)
 */
export function shouldBootstrapAdmin(): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;
  return !!adminEmails && adminEmails.trim().length > 0;
}

/**
 * Vérifie si un email est dans la whitelist ADMIN_EMAILS
 */
export function isWhitelisted(email: string): boolean {
  if (!shouldBootstrapAdmin()) {
    console.log('[Admin Bootstrap] Bootstrap admin not enabled');
    return false;
  }
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0) || [];
  const isWhitelisted = adminEmails.includes(email.toLowerCase());
  
  console.log('[Admin Bootstrap] Checking whitelist:', {
    email: email.toLowerCase(),
    adminEmails,
    isWhitelisted,
  });
  
  return isWhitelisted;
}

/**
 * Assure qu'un utilisateur est ADMIN si son email est whitelisté
 * Met à jour le rôle en ADMIN et approuve la demande admin si nécessaire
 */
export async function ensureAdminForEmail(email: string): Promise<void> {
  if (!isWhitelisted(email)) {
    console.log(`[Admin Bootstrap] Email ${email} is not whitelisted`);
    return;
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      // User n'existe pas encore, sera créé lors de la prochaine connexion
      console.log(`[Admin Bootstrap] User ${email} does not exist yet`);
      return;
    }
    
    console.log(`[Admin Bootstrap] User ${email} found, current role:`, user.role);
    
        // Si l'utilisateur n'est pas déjà ADMIN, le promouvoir
        if (user.role !== Role.ADMIN) {
          await prisma.user.update({
            where: { email },
            data: {
              role: Role.ADMIN,
              activeRole: Role.ADMIN, // Définir activeRole à ADMIN aussi
              adminRequestStatus: 'APPROVED',
              roleChosenAt: user.roleChosenAt || new Date(), // S'assurer que roleChosenAt est défini
            },
          });
          console.log(`[Admin Bootstrap] ✅ User ${email} promoted to ADMIN`);
        } else if (!user.roleChosenAt || !(user as any).activeRole) {
          // Si déjà ADMIN mais roleChosenAt ou activeRole est null, les définir
          await prisma.user.update({
            where: { email },
            data: {
              roleChosenAt: user.roleChosenAt || new Date(),
              activeRole: (user as any).activeRole || Role.ADMIN, // S'assurer que activeRole est défini
            },
          });
          console.log(`[Admin Bootstrap] ✅ User ${email} already ADMIN, setting roleChosenAt and activeRole`);
        } else {
          console.log(`[Admin Bootstrap] ✅ User ${email} already ADMIN with roleChosenAt and activeRole`);
        }
  } catch (error) {
    console.error(`[Admin Bootstrap] ❌ Error ensuring admin for ${email}:`, error);
  }
}

