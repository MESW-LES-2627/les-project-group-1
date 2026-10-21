import { sql } from "./db";

/**
 * Database migration script
 * 
 * Runs the schema.sql file against the PostgreSQL database using Bun's native SQL client.
 * Create ot update the database schema as defined in the schema.sql file
 */

await sql.file("./src/schema.sql");
console.log("schema aplicado");
await sql.close();