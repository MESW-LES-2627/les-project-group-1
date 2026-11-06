import { sql } from "../src/config/db";

/**
 * Creates the first Admin user if it doesn't exist yet.
 * Safe to run on every deploy: it never changes an existing user.
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD and optionally ADMIN_USERNAME / ADMIN_COUNTRY
 * from the environment (.env). Run with: bun seeds/admin.ts
 */
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const username = process.env.ADMIN_USERNAME?.trim() || "admin";
const country = "PT";

if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin.");
} else if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters long.");
    process.exitCode = 1;
} else {
    const [existing] = await sql`select id from users where email = ${email}`;

    if (existing) {
        console.log(`${email} already exists, nothing to do.`);
    } else {
        const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
        await sql`
      insert into users (username, email, password_hash, country, role)
      values (${username}, ${email}, ${passwordHash}, ${country}, 'ADMIN')
    `;
        console.log(`admin ${email} created`);
    }
}

await sql.close();