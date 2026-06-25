// Concatenates all Prisma migration SQL (in lexical/apply order) to stdout, so the full schema
// can be applied to a Turso libSQL database in one shot — Prisma's migration engine can't drive a
// libsql:// URL directly, so the schema is applied out-of-band:
//
//   node scripts/build-turso-schema.mjs | turso db shell <your-db-name>
//
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "prisma/migrations";
const migrations = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let out = "-- Coinly schema for Turso — generated from prisma/migrations (do not edit)\n";
for (const name of migrations) {
  out += `\n-- migration: ${name}\n${readFileSync(join(dir, name, "migration.sql"), "utf8").trim()}\n`;
}
process.stdout.write(out);
