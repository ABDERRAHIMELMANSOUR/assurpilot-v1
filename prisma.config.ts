// prisma.config.ts — Prisma 7, Railway-safe
//
// CRITICAL FIX: The env() helper from "prisma/config" THROWS
// if the variable is undefined. During Railway's build phase
// (npm ci → postinstall → prisma generate), DATABASE_URL is
// NOT injected yet. This crashes the entire build.
//
// Fix: Use process.env.DATABASE_URL which returns undefined
// instead of throwing. Prisma 7.2+ allows prisma generate
// to run without a database URL — it only needs the URL for
// db push / migrate / studio.

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
