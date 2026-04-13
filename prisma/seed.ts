// prisma/seed.ts — Prisma 7, Railway-safe, idempotent

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error("❌ DATABASE_URL is not set. Skipping seed.");
  process.exit(0);
}

const isPrivate = connStr.includes(".railway.internal");
const pool = new Pool({
  connectionString: connStr,
  ssl: isPrivate ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log("🌱 Seeding AssurPilot...");

  // 1. Result options
  const options = [
    { label: "Devis réalisé",  value: "DEVIS_REALISE",  color: "green",  order: 0 },
    { label: "Information",    value: "INFORMATION",    color: "blue",   order: 1 },
    { label: "Non intéressé",  value: "NON_INTERESSE",  color: "red",    order: 2 },
    { label: "Rappel prévu",   value: "RAPPEL_PREVU",   color: "yellow", order: 3 },
    { label: "Devis envoyé",   value: "DEVIS_ENVOYE",   color: "purple", order: 4 },
    { label: "Faux numéro",    value: "FAUX_NUMERO",    color: "gray",   order: 5 },
  ];
  for (const opt of options) {
    await prisma.callResultOption.upsert({
      where: { value: opt.value },
      update: {},
      create: { ...opt, isActive: true },
    });
  }
  console.log("  ✓ Result options");

  // 2. Teams
  const teamAuto = await prisma.team.upsert({
    where: { id: "team-auto" },
    update: {},
    create: { id: "team-auto", nom: "Pôle Auto", description: "Assurances auto" },
  });
  console.log("  ✓ Teams");

  // 3. Users (Cleaned from 'name' and 'phoneNumber')
  const usersToCreate = [
    {
      email: "admin@assurpilot.fr",
      nom: "Martin",
      prenom: "François",
      phone: "+33100000001",
      role: "ADMINISTRATEUR",
      password: hash("admin123")
    },
    {
      email: "coach@assurpilot.fr",
      nom: "Dubois",
      prenom: "Claire",
      phone: "+33600000002",
      role: "SUPERVISEUR",
      teamId: teamAuto.id,
      password: hash("coach123")
    },
    {
      email: "marie.laurent@assurpilot.fr",
      nom: "Laurent",
      prenom: "Marie",
      phone: "0988288362",
      role: "CONSEILLER",
      teamId: teamAuto.id,
      password: hash("agent123")
    }
  ];

  for (const u of usersToCreate) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log("  ✓ Users (Admin, Coach, Agents)");

  // 4. Phone lines
  const lineAuto = await prisma.phoneLine.upsert({
    where: { id: "line-auto" },
    update: {},
    create: { id: "line-auto", label: "Ligne Auto", numeroMasque: "0988288362", isActive: true },
  });
  console.log("  ✓ Phone lines");

  // 5. Sample calls (Cleaned from 'dateTime')
  const existingCalls = await prisma.call.count();
  if (existingCalls === 0) {
    const d = new Date();
    await prisma.call.create({
      data: {
        phoneLineId: lineAuto.id,
        callerNumber: "+33612345642",
        isMissed: false,
        durationSeconds: 300,
        statut: "REPONDU",
        startedAt: d,
        endedAt: new Date(d.getTime() + 300000),
      },
    });
    console.log("  ✓ Sample call created");
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });