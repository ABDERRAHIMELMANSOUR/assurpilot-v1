// prisma/seed.ts — Prisma 7, idempotent, Railway-safe
// Uses: nom, prenom, phoneNumber, startedAt (NO name, NO phone, NO dateTime)

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.log("⏭ DATABASE_URL not set — skipping seed.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: connStr,
  ssl: connStr.includes(".railway.internal") ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

function daysAgo(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding AssurPilot...");

  // ── Result options ──
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

  // ── Teams ──
  const teamAuto = await prisma.team.upsert({
    where: { id: "team-auto" },
    update: {},
    create: { id: "team-auto", nom: "Pôle Auto", description: "Assurances auto" },
  });
  const teamSante = await prisma.team.upsert({
    where: { id: "team-sante" },
    update: {},
    create: { id: "team-sante", nom: "Pôle Santé", description: "Complémentaires santé et prévoyance" },
  });
  console.log("  ✓ Teams");

  // ── Admin ──
  await prisma.user.upsert({
    where: { email: "admin@assurpilot.fr" },
    update: {},
    create: {
      email: "admin@assurpilot.fr",
      password: hash("admin123"),
      nom: "Martin",
      prenom: "François",
      phoneNumber: "+33 1 00 00 00 01",
      role: "ADMINISTRATEUR",
    },
  });
  console.log("  ✓ Admin");

  // ── Coach ──
  const coach = await prisma.user.upsert({
    where: { email: "coach@assurpilot.fr" },
    update: {},
    create: {
      email: "coach@assurpilot.fr",
      password: hash("coach123"),
      nom: "Dubois",
      prenom: "Claire",
      phoneNumber: "+33 6 00 00 00 02",
      role: "SUPERVISEUR",
      teamId: teamAuto.id,
    },
  });
  await prisma.team.update({
    where: { id: teamAuto.id },
    data: { superviseurId: coach.id },
  }).catch(() => {});
  console.log("  ✓ Coach");

  // ── Conseillers ──
  const agent1 = await prisma.user.upsert({
    where: { email: "marie.laurent@assurpilot.fr" },
    update: {},
    create: {
      email: "marie.laurent@assurpilot.fr",
      password: hash("agent123"),
      nom: "Laurent",
      prenom: "Marie",
      phoneNumber: "0988288362",
      role: "CONSEILLER",
      teamId: teamAuto.id,
      superviseurId: coach.id,
    },
  });
  const agent2 = await prisma.user.upsert({
    where: { email: "pierre.durand@assurpilot.fr" },
    update: {},
    create: {
      email: "pierre.durand@assurpilot.fr",
      password: hash("agent123"),
      nom: "Durand",
      prenom: "Pierre",
      phoneNumber: "0180873462",
      role: "CONSEILLER",
      teamId: teamSante.id,
      superviseurId: coach.id,
    },
  });
  console.log("  ✓ Conseillers");

  // ── Phone lines ──
  const lineAuto = await prisma.phoneLine.upsert({
    where: { id: "line-auto" },
    update: {},
    create: { id: "line-auto", label: "Ligne Auto", numeroMasque: "0988288362", isActive: true },
  });
  const lineSante = await prisma.phoneLine.upsert({
    where: { id: "line-sante" },
    update: {},
    create: { id: "line-sante", label: "Ligne Santé", numeroMasque: "0180873462", isActive: true },
  });
  console.log("  ✓ Phone lines");

  // ── Keyyo config ──
  await prisma.keyyoConfig.upsert({
    where: { id: "keyyo-default" },
    update: {},
    create: {
      id: "keyyo-default",
      webhookUrl: "https://votre-domaine.fr/webhooks/voip/keyyo",
      distributionMode: "ROUND_ROBIN",
      maxRingSeconds: 30,
      isActive: false,
    },
  });
  console.log("  ✓ Keyyo config");

  // ── Sample calls (skip if data exists) ──
  const count = await prisma.call.count();
  if (count === 0) {
    const calls = [
      { line: lineAuto,  agent: agent1, caller: "+33 6 12 34 56 42", missed: false, dur: 374, at: daysAgo(0,14,23), res: "DEVIS_REALISE",  notes: "Assurance auto tout risque" },
      { line: lineAuto,  agent: agent1, caller: "+33 7 65 43 21 18", missed: false, dur: 125, at: daysAgo(0,13,47), res: "INFORMATION",    notes: "Questions sur garantie" },
      { line: lineAuto,  agent: agent1, caller: "+33 6 98 76 54 32", missed: true,  dur: 0,   at: daysAgo(0,12,10), res: null, notes: null },
      { line: lineAuto,  agent: agent1, caller: "+33 6 11 22 33 91", missed: false, dur: 527, at: daysAgo(0,11,32), res: "DEVIS_REALISE",  notes: "Famille 2 voitures" },
      { line: lineAuto,  agent: agent1, caller: "+33 9 44 55 66 07", missed: false, dur: 89,  at: daysAgo(1,16, 5), res: "NON_INTERESSE",  notes: "Déjà assuré" },
      { line: lineAuto,  agent: agent1, caller: "+33 6 77 88 99 55", missed: false, dur: 412, at: daysAgo(1,10,30), res: "RAPPEL_PREVU",   notes: "Rappeler jeudi matin" },
      { line: lineAuto,  agent: agent1, caller: "+33 7 12 98 76 54", missed: true,  dur: 0,   at: daysAgo(2, 9,15), res: null, notes: null },
      { line: lineSante, agent: agent2, caller: "+33 6 10 20 30 12", missed: false, dur: 445, at: daysAgo(0,15,10), res: "DEVIS_REALISE",  notes: "Appartement Paris 75011" },
      { line: lineSante, agent: agent2, caller: "+33 7 88 99 00 88", missed: false, dur: 210, at: daysAgo(0,14, 0), res: "INFORMATION",    notes: "Résiliation en cours" },
      { line: lineSante, agent: agent2, caller: "+33 6 64 75 86 97", missed: false, dur: 603, at: daysAgo(1,11,50), res: "DEVIS_REALISE",  notes: "Mutuelle famille 4 personnes" },
    ];

    for (const c of calls) {
      const call = await prisma.call.create({
        data: {
          phoneLineId:    c.line.id,
          assignedUserId: c.agent.id,
          callerNumber:   c.caller,
          isMissed:       c.missed,
          durationSeconds: c.dur,
          statut:         c.missed ? "MANQUE" : "REPONDU",
          startedAt:      c.at,
          endedAt:        c.missed ? null : new Date(c.at.getTime() + c.dur * 1000),
        },
      });
      if (c.res) {
        await prisma.callResult.create({
          data: { callId: call.id, userId: c.agent.id, resultat: c.res, notes: c.notes },
        });
      }
    }
    console.log("  ✓ Sample calls (10)");
  } else {
    console.log(`  ⏭ Calls exist (${count}) — skipping`);
  }

  console.log("\n✅ Seed complete!");
  console.log("  👑 admin@assurpilot.fr / admin123");
  console.log("  🎯 coach@assurpilot.fr / coach123");
  console.log("  👤 marie.laurent@assurpilot.fr / agent123");
  console.log("  👤 pierre.durand@assurpilot.fr / agent123");
}

main()
  .catch((e) => console.error("❌ Seed error:", e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });