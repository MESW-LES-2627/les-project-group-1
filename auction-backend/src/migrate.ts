import { sql } from "./db";

await sql.file("./src/schema.sql");
console.log("schema aplicado");
await sql.close();