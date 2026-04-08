// src/lib/prisma.ts — Prisma 7 Driver Adapter for Railway PostgreSQL
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL!;

// Railway private networking (.railway.internal) does NOT use SSL.
// Railway public proxy (.proxy.rlwy.net) DOES use SSL.
const isPrivateNetwork = connectionString?.includes(".railway.internal");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    ssl: isPrivateNetwork ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
}

function makePrisma() {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
