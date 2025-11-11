import { Mission, Submission, User } from '@prisma/client';

export function isAdmin(user: Pick<User, 'role'> | null | undefined) {
  return !!user && user.role === 'ADMIN';
}

export function isAnnonceur(user: Pick<User, 'role'> | null | undefined) {
  return !!user && user.role === 'ANNONCEUR';
}

export function canCreateMission(user: Pick<User, 'role'> | null | undefined) {
  return isAdmin(user) || isAnnonceur(user);
}

export function isMissionOwner(mission: Mission, userId: string) {
  return mission.ownerId === userId;
}

export function canModerate(user: Pick<User, 'role'> | null | undefined) {
  return isAdmin(user);
}

export function canAccessThread(sub: Submission, userId: string, missionOwnerId: string) {
  return sub.status === 'ACCEPTED' && (sub.userId === userId || missionOwnerId === userId);
}

export function canRateSubmission(sub: Submission, userId: string) {
  return sub.status === 'ACCEPTED' && sub.userId === userId;
}


