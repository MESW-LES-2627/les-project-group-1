import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";

const EMAILS = ["profile1@test.pt", "profile2@test.pt"];

let baseUrl = "";
let firstToken = "";
let secondToken = "";

async function register(username: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password: "securepassword123", country: "PT" }),
  });
  const data: any = await response.json();
  return data.token;
}

function authed(token: string, method: string, body?: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

async function cleanUp() {
  await prisma.winner.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
}

beforeAll(async () => {
  if (!httpServer.listening) {
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  }
  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 3000;
  baseUrl = `http://127.0.0.1:${port}`;

  await cleanUp();
  firstToken = await register("profileone", "profile1@test.pt");
  secondToken = await register("profiletwo", "profile2@test.pt");
});

afterAll(async () => {
  await cleanUp();
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
    const data: any = await response.json();
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

  it("rejects an expired token", async () => {
    await prisma.session.update({
      where: { token: secondToken },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const response = await fetch(`${baseUrl}/api/users/me`, authed(secondToken, "GET"));
    expect(response.status).toBe(401);
    await prisma.session.update({
      where: { token: secondToken },
      data: { expiresAt: new Date(Date.now() + 60_000) },
    });
  });

  it("returns the own profile without sensitive fields", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data: any = await response.json();
    expect(response.status).toBe(200);
    expect(data.user).toEqual({ username: "profileone", email: "profile1@test.pt", country: "PT", avatar: null });
    expect(JSON.stringify(data)).not.toContain("password");
  });

  it("updates username and country and keeps the email", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profileuno", country: "ES", email: "hacker@test.pt" })
    );
    const data: any = await response.json();
    expect(response.status).toBe(200);
    expect(data.user).toEqual({ username: "profileuno", email: "profile1@test.pt", country: "ES" });
  });

  it("returns the updated profile afterwards", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data: any = await response.json();
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
    const data: any = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_username");
  });

  it("rejects an invalid country", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profileuno", country: "" })
    );
    const data: any = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_country");
  });

  it("returns 409 when the username belongs to another user", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me`,
      authed(firstToken, "PUT", { username: "profiletwo", country: "PT" })
    );
    const data: any = await response.json();
    expect(response.status).toBe(409);
    expect(data.error).toBe("username_taken");
  });

  it("does not change other users", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(secondToken, "GET"));
    const data: any = await response.json();
    expect(data.user).toEqual({ username: "profiletwo", email: "profile2@test.pt", country: "PT", avatar: null });
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
    const data: any = await response.json();
    expect(response.status).toBe(200);
    expect(data.purchases).toEqual([]);
  });

  it("lists only the paid purchases of the user", async () => {
    await prisma.winner.createMany({
      data: [
        { itemName: "Velocity", socketId: "s1", email: "profile1@test.pt", winningBid: 56, status: "paid", paidAt: new Date() },
        { itemName: "Pending Shirt", socketId: "s2", email: "profile1@test.pt", winningBid: 70, status: "pending_payment" },
        { itemName: "Other Shirt", socketId: "s3", email: "profile2@test.pt", winningBid: 80, status: "paid", paidAt: new Date() },
      ],
    });

    const response = await fetch(`${baseUrl}/api/users/me/purchases`, authed(firstToken, "GET"));
    const data: any = await response.json();
    expect(response.status).toBe(200);
    expect(data.purchases.length).toBe(1);
    expect(data.purchases[0].itemName).toBe("Velocity");
    expect(data.purchases[0].amount).toBe(56);
    expect(data.purchases[0].paidAt).toBeTruthy();
  });
});

describe("profile photo", () => {
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";

  it("requires authentication", async () => {
    const response = await fetch(`${baseUrl}/api/users/me/avatar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photo }),
    });
    expect(response.status).toBe(401);
  });

  it("saves the photo and returns it with the profile", async () => {
    const save = await fetch(`${baseUrl}/api/users/me/avatar`, authed(firstToken, "PUT", { image: photo }));
    expect(save.status).toBe(200);

    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data: any = await response.json();
    expect(data.user.avatar).toBe(photo);
  });

  it("rejects an image that is not a jpeg", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me/avatar`,
      authed(firstToken, "PUT", { image: "data:image/png;base64,iVBORw0KGgo=" })
    );
    const data: any = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_image");
  });

  it("rejects an image that is too large", async () => {
    const response = await fetch(
      `${baseUrl}/api/users/me/avatar`,
      authed(firstToken, "PUT", { image: "data:image/jpeg;base64,/9j/" + "A".repeat(90000) })
    );
    const data: any = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("image_too_large");
  });

  it("keeps the previous photo after a rejected upload", async () => {
    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data: any = await response.json();
    expect(data.user.avatar).toBe(photo);
  });

  it("removes the photo", async () => {
    const remove = await fetch(`${baseUrl}/api/users/me/avatar`, authed(firstToken, "DELETE"));
    expect(remove.status).toBe(200);

    const response = await fetch(`${baseUrl}/api/users/me`, authed(firstToken, "GET"));
    const data: any = await response.json();
    expect(data.user.avatar).toBeNull();
  });
});