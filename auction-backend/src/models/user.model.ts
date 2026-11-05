import { sql } from "../config/db";

/** Queries for the `users` table. */

export async function emailExists(email: string) {
  const rows = await sql`select id from users where email = ${email}`;
  return rows.length > 0;
}

export async function createUser(username: string, email: string, passwordHash: string, country: string) {
  const rows = await sql`
    insert into users (username, email, password_hash, country)
    values (${username}, ${email}, ${passwordHash}, ${country})
    returning username, email, created_at, country`;
  return rows[0];
}

export async function findForLogin(email: string) {
  const rows = await sql`select id, username, email, password_hash, country from users where email = ${email}`;
  return rows[0];
}

export async function findIdByEmail(email: string) {
  const rows = await sql`SELECT id FROM users WHERE lower(email) = lower(${email})`;
  return rows[0];
}

export async function findProfileByEmail(email: string) {
  const rows = await sql`select username, country from users where lower(email) = lower(${email})`;
  return rows[0];
}

export async function setResetToken(email: string, token: string, expiresAt: Date) {
  await sql`
    UPDATE users
    SET reset_token = ${token}, reset_token_expires = ${expiresAt}
    WHERE lower(email) = lower(${email})`;
}

export async function findByValidResetToken(token: string) {
  const rows = await sql`
    SELECT id FROM users
    WHERE reset_token = ${token}
    AND reset_token_expires > NOW()`;
  return rows[0];
}

export async function updatePassword(userId: number, passwordHash: string) {
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
    WHERE id = ${userId}`;
}
