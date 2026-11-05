import { readdirSync } from "fs";
import { join } from "path";
import { sql } from "../config/db";

/**
 * Applies the .sql files in /migrations in order, skipping the ones already applied.
 * Applied files are recorded in the `schema_migrations` table.
 * Run with: bun run migrate
 */
const dir = join(import.meta.dir, "../../migrations");

await sql`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`;

const applied = new Set((await sql`select name from schema_migrations`).map((r: any) => r.name));
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const text = await Bun.file(join(dir, file)).text();
  await sql.begin(async (tx) => {
    await tx.unsafe(text);
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  console.log(`applied ${file}`);
}

console.log("migrations up to date");
await sql.close();
