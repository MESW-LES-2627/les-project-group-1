import { SQL } from "bun";
import { env } from "./env";

/** Bun's native PostgreSQL client. */
export const sql = new SQL(env.databaseUrl);
