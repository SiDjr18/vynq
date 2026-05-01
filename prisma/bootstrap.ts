import "dotenv/config";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function sqlitePathFromUrl(url: string) {
  if (!url.startsWith("file:")) return null;
  const raw = url.slice("file:".length);
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(process.cwd(), "prisma", raw);
}

const dbPath = sqlitePathFromUrl(process.env.DATABASE_URL || "file:./dev.db");
if (dbPath && fs.existsSync(dbPath)) {
  fs.rmSync(dbPath, { force: true });
}

const prismaCli = path.resolve(process.cwd(), "node_modules/prisma/build/index.js");
const sql = execFileSync(
  process.execPath,
  [prismaCli, "migrate", "diff", "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
);

const prisma = new PrismaClient();
const statements = sql
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim())
  .filter(Boolean);

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

await prisma.$disconnect();
console.log(`SQLite schema bootstrapped with ${statements.length} statements`);
