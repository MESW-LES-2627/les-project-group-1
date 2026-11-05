import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../index";
import { sql } from "../src/db";

let baseUrl = "";
let firstToken = "";
let secondToken = "";

async function register(username: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password: "securepassword123", country: "PT" }),
  });
  const data = await response.json();
  return data.token;
}

function authed(token: string, method: string, body?: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

beforeAll(async () => {
  if (!httpServer.listening) httpServer.listen(0);
  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 3000;
  baseUrl = `http://localhost:${port}`;

  await sql`DELETE FROM winners WHERE email IN ('profile1@test.pt', 'profile2@test.pt')`;
  await sql`DELETE FROM users WHERE email IN ('profile1@test.pt', 'profile2@test.pt')`;
  firstToken = await register("profileone", "profile1@test.pt");
  secondToken = await register("profiletwo", "profile2@test.pt");
});

afterAll(async () => {
  await sql`DELETE FROM winners WHERE email IN ('profile1@test.pt', 'profile2@test.pt')`;
  await sql`DELETE FROM users WHERE email IN ('profile1@test.pt', 'profile2@test.pt')`;
  httpServer.close();
});

describe("registration and login return a session token", () => {
  it("returns a token on register", () => {
    expect(typeof firstToken).toBe("string");
    expect(firstToken.length).toBeGreaterThan(20);
  });

  it("returns a token on login", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "profile1@test.pt", password: "securepassword123" }),
    });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(typeof data.token).toBe("string");
  });
});

describe("own profile management", () => {
  it("requires authentication", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`);
    expect(response.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed("invalid", "GET"));
    expect(response.status).toBe(401);
  });

  it("returns the own profile without sensitive fields", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.user).toEqual({ username: "profileone", email: "profile1@test.pt", country: "PT" });
    expect(JSON.stringify(data)).not.toContain("password");
  });

  it("updates username and country and keeps the email", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profileuno", country: "ES", email: "hacker@test.pt" })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.user).toEqual({ username: "profileuno", email: "profile1@test.pt", country: "ES" });
  });

  it("returns the updated profile afterwards", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data = await response.json();
    expect(data.user.username).toBe("profileuno");
    expect(data.user.country).toBe("ES");
  });

  it("allows saving while keeping the own username", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profileuno", country: "FR" })
    );
    expect(response.status).toBe(200);
  });

  it("rejects a username that is too short", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "ab", country: "PT" })
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_username");
  });

  it("rejects an invalid country", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profileuno", country: "" })
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_country");
  });

  it("returns 409 when the username belongs to another user", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profiletwo", country: "PT" })
    );
    const data = await response.json();
    expect(response.status).toBe(409);
    expect(data.error).toBe("username_taken");
  });

  it("does not change other users", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(secondToken, "GET"));
    const data = await response.json();
    expect(data.user).toEqual({ username: "profiletwo", email: "profile2@test.pt", country: "PT" });
  });

  it("invalidates the token on logout", async () => {
    const logout = await fetch(`${baseUrl}/api/auth/logout`, authed(secondToken, "POST"));
    expect(logout.status).toBe(200);

    const response = await fetch(`${baseUrl}/api/users/me`, authed(secondToken, "GET"));
    expect(response.status).toBe(401);
  });
});

describe("purchased jerseys", () => {
  it("requires authentication", async () => {
    const response = await fetch(`${baseUrl}/api/users/me/purchases`);
    expect(response.status).toBe(401);
  });

  it("starts with no purchases", async () => {
    const response = await fetch(`${baseUrl}/api/users/me/purchases`, authed(firstToken, "GET"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.purchases).toEqual([]);
  });

  it("lists only the paid purchases of the user", async () => {
    await sql`
      INSERT INTO winners (item_name, socket_id, email, winning_bid, status, paid_at)
      VALUES ('Velocity', 's1', 'profile1@test.pt', 56, 'paid', now())
    `;
    await sql`
      INSERT INTO winners (item_name, socket_id, email, winning_bid, status, paid_at)
      VALUES ('Pending Shirt', 's2', 'profile1@test.pt', 70, 'pending_payment', NULL)
    `;
    await sql`
      INSERT INTO winners (item_name, socket_id, email, winning_bid, status, paid_at)
      VALUES ('Other Shirt', 's3', 'profile2@test.pt', 80, 'paid', now())
    `;

    const response = await fetch(`${baseUrl}/api/users/me/purchases`, authed(firstToken, "GET"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.purchases.length).toBe(1);
    expect(data.purchases[0].itemName).toBe("Velocity");
    expect(data.purchases[0].amount).toBe(56);
    expect(data.purchases[0].paidAt).toBeTruthy();
  });
});