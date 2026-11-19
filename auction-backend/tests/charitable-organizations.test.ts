import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";

const PORT = 3002; // diffent port for testing to avoid conflicts with the main server
const BASE_URL = `http://localhost:${PORT}`;

let adminToken = "";
let buyerToken = "";
let createdOrgId = 0;

beforeAll(async () => {
  if (!httpServer.listening) {
    httpServer.listen(PORT);
  }

  // Clean up tables before running tests
  await prisma.charitableOrganization.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { in: ["charity-admin@feup.pt", "charity-buyer@feup.pt"] },
    },
  });

  // 1. Create an ADMIN user and log in to get a Bearer token
  const adminPasswordHash = await Bun.password.hash("adminpassword123", {
    algorithm: "argon2id",
  });
  await prisma.user.create({
    data: {
      username: "charityadmin",
      email: "charity-admin@feup.pt",
      passwordHash: adminPasswordHash,
      country: "PT",
      role: "ADMIN",
    },
  });

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "charity-admin@feup.pt",
      password: "adminpassword123",
    }),
  });
  const adminLoginData: any = await adminLoginRes.json();
  adminToken = adminLoginData.token;

  // 2. Create a BUYER user and log in to test role protection
  const buyerPasswordHash = await Bun.password.hash("buyerpassword123", {
    algorithm: "argon2id",
  });
  await prisma.user.create({
    data: {
      username: "charitybuyer",
      email: "charity-buyer@feup.pt",
      passwordHash: buyerPasswordHash,
      country: "PT",
      role: "BUYER",
    },
  });

  const buyerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "charity-buyer@feup.pt",
      password: "buyerpassword123",
    }),
  });
  const buyerLoginData: any = await buyerLoginRes.json();
  buyerToken = buyerLoginData.token;
});

afterAll(async () => {
  await prisma.charitableOrganization.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { in: ["charity-admin@feup.pt", "charity-buyer@feup.pt"] },
    },
  });
  httpServer.close();
  await prisma.$disconnect();
});

/*************************************
 * AUTHORIZATION & ACCESS CONTROL    *
 *************************************/

describe("Charitable Organizations Access Control", () => {
  it("should reject unauthenticated requests with 401", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations`);
    expect(response.status).toBe(401);
  });

  it("should forbid non-admin users (BUYER) with 403", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(response.status).toBe(403);
  });
});

/*************************************
 *               CREATE              *
 *************************************/

describe("POST /api/admin/charitable-organizations", () => {
  it("should create a new charitable organization with valid data", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Causa Compartilhada",
        description: "Apoio social através de leilões solidários.",
        logoUrl: "https://example.com/logo-causa.png",
      }),
    });

    const data: any = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Charitable organization created successfully.");
    expect(data.organization.name).toBe("Causa Compartilhada");
    expect(data.organization.description).toBe("Apoio social através de leilões solidários.");
    expect(data.organization.logoUrl).toBe("https://example.com/logo-causa.png");

    createdOrgId = data.organization.id;
  });

  it("should fail if name is missing or empty", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "   ",
        description: "Sem nome válido",
      }),
    });

    const data: any = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Name is required.");
  });

  it("should reject duplicate organization names with 409", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Causa Compartilhada",
        description: "Tentativa duplicada",
      }),
    });

    const data: any = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Charitable organization name already exists.");
  });
});

/*************************************
 *    READ (GET LIST & GET BY ID)    *
 *************************************/

describe("GET /api/admin/charitable-organizations", () => {
  it("should list charitable organizations with pagination and search", async () => {
    const response = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations?search=Causa&page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe("Causa Compartilhada");
  });

  it("should get a single charitable organization by ID", async () => {
    const response = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations/${createdOrgId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(createdOrgId);
    expect(data.name).toBe("Causa Compartilhada");
  });

  it("should return 404 for a non-existent ID", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/charitable-organizations/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data: any = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Charitable organization not found.");
  });
});

/*************************************
 *              UPDATE               *
 *************************************/

describe("PATCH /api/admin/charitable-organizations/:id", () => {
  it("should update an existing charitable organization", async () => {
    const response = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations/${createdOrgId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Causa Compartilhada Brasil",
          description: "Descrição atualizada",
        }),
      }
    );

    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Charitable organization updated successfully.");
    expect(data.organization.name).toBe("Causa Compartilhada Brasil");
    expect(data.organization.description).toBe("Descrição atualizada");
  });

  it("should fail if payload has no fields to update", async () => {
    const response = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations/${createdOrgId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    const data: any = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Nothing to update.");
  });
});

/*********************
 *      DELETE       *
 **********************/

describe("DELETE /api/admin/charitable-organizations/:id", () => {
  it("should delete the charitable organization and return 404 afterwards", async () => {
    const deleteRes = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations/${createdOrgId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    const deleteData: any = await deleteRes.json();
    expect(deleteRes.status).toBe(200);
    expect(deleteData.message).toBe("Charitable organization deleted successfully.");

    // Verify it is gone
    const getRes = await fetch(
      `${BASE_URL}/api/admin/charitable-organizations/${createdOrgId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    expect(getRes.status).toBe(404);
  });
});