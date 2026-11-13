import { join } from "path";
import { sql } from "../src/config/db.ts";

/**
 * Loads the demo catalogue (clubs, categories, listings).
 * Safe to run many times: the SQL upserts by natural key, so editing demo.sql
 * and re-running this refreshes an existing database too. Auction end times are
 * relative to "now", so each run also restarts the demo countdowns.
 * Run with: bun run seed
 */
await sql.file(join(import.meta.dir, "demo.sql"));
console.log("demo data loaded");
await sql.close();
