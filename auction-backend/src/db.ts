import { SQL } from "bun";

/**
 * Database Client
 * 
 * Initializes Bun's native SQL client using the DATABASE_URL environment variable.
 */

export const sql = new SQL(process.env.DATABASE_URL!);