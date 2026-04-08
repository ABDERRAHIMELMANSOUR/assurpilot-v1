// src/lib/constants.ts — Shared Prisma select objects
// Moved here because Next.js App Router route files
// must only export HTTP handlers (GET, POST, etc.)

export const USER_SELECT = {
  id: true, nom: true, prenom: true, name: true, email: true, phoneNumber: true,
  role: true, isActive: true, teamId: true,
  superviseurId: true, createdAt: true, lastLoginAt: true,
  team:        { select: { id: true, nom: true } },
  superviseur: { select: { id: true, nom: true, prenom: true, phoneNumber: true } },
} as const;
