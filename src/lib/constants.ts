// src/lib/constants.ts — Shared Prisma select objects
// Matches the clean V6 schema (nom/prenom/phoneNumber, no name field)

export const USER_SELECT = {
  id: true, nom: true, prenom: true, email: true, phoneNumber: true,
  role: true, isActive: true, teamId: true,
  superviseurId: true, createdAt: true, lastLoginAt: true,
  team:        { select: { id: true, nom: true } },
  superviseur: { select: { id: true, nom: true, prenom: true, phoneNumber: true } },
} as const;