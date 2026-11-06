import { join } from "path";
import { sql } from "../src/config/db.ts";

/**
 * Loads the demo catalogue (clubs, categories, listings).
 * Safe to run many times: existing rows are skipped, and auction end times are
 * relative to "now", so re-seed a fresh database to get fresh countdowns.
 * Run with: bun run seed
 */
await sql.file(join(import.meta.dir, "demo.sql"));
console.log("demo data loaded");
await sql.close();
