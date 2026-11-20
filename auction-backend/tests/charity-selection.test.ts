import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "charity-selection-admin@test.pt";
const CLUB_EMAIL = "charity-selection-club@test.pt";
const CLUB_SLUG = "charity-selection-club";
const CATEGORY_SLUG = "charity-selection-category";
const VERIFIED_NAME = "Verified Selection Charity";
const UNVERIFIED_NAME = "Unverified Selection Charity";
const LISTING_TITLE = "Charity Selection Test Shirt";
const REJECTED_TITLE = "Charity Selection Rejected Shirt";

let baseUrl = "";
let adminToken = "";
let clubToken = "";
let clubId = 0;
let categoryId = 0;
let verifiedId = 0;
let unverifiedId = 0;
let listingId = 0;

function authed(token: string, method: string, body?: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

async function cleanUp() {
  await prisma.listing.deleteMany({ where: { title: { in: [LISTING_TITLE, REJECTED_TITLE] } } });
  await prisma.club.deleteMany({ where: { slug: CLUB_SLUG } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, CLUB_EMAIL] } } });
  await prisma.charitableOrganization.deleteMany({
    where: { name: { in: [VERIFIED_NAME, UNVERIFIED_NAME] } },
  });
  await prisma.category.deleteMany({ where: { slug: CATEGORY_SLUG } });
}

beforeAll(async () => {
  if (!httpServer.listening) {
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  }
  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 3000;
  baseUrl = `http://127.0.0.1:${port}`;

  await cleanUp();

  const adminHash = await Bun.password.hash("adminpassword123", { algorithm: "argon2id" });
  await prisma.user.create({
    data: {
      username: "charityselectionadmin",
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      country: "PT",
      role: "ADMIN",
    },
  });
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "adminpassword123" }),
  });
  adminToken = ((await adminLogin.json()) as { token: string }).token;

  const category = await prisma.category.create({
    data: { slug: CATEGORY_SLUG, name: "Charity selection" },
    select: { id: true },
  });
  categoryId = category.id;

  const register = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "charityselectionclub",
      email: CLUB_EMAIL,
      password: "clubpassword123",
      country: "PT",
      accountType: "CLUB",
      clubName: "Charity Selection Club",
      clubSlug: CLUB_SLUG,
    }),
  });
  const registered: any = await register.json();
  clubToken = registered.token;
  clubId = registered.user.club.id;

  await fetch(`${baseUrl}/api/admin/clubs/${clubId}`, authed(adminToken, "PATCH", { status: "approved" }));

  const verified = await fetch(
    `${baseUrl}/api/admin/charitable-organizations`,
    authed(adminToken, "POST", {
      name: VERIFIED_NAME,
      description: "A verified charity.",
      logoUrl: "/images/charities/goal-for-kids.svg",
      country: "PT",
      verified: true,
    }),
  );
  verifiedId = ((await verified.json()) as any).organization.id;

  const unverified = await fetch(
    `${baseUrl}/api/admin/charitable-organizations`,
    authed(adminToken, "POST", {
      name: UNVERIFIED_NAME,
      description: "Still waiting for approval.",
      country: "BR",
      verified: false,
    }),
  );
  unverifiedId = ((await unverified.json()) as any).organization.id;
});

afterAll(async () => {
  await cleanUp();
  httpServer.close();
});

describe("verified charity selection", () => {
  it("lists only verified charities for clubs", async () => {
    const response = await fetch(`${baseUrl}/api/charities`);
    const charities = (await response.json()) as any[];

    expect(response.status).toBe(200);
    expect(charities.some((charity) => charity.id === verifiedId)).toBe(true);
    expect(charities.some((charity) => charity.id === unverifiedId)).toBe(false);
    const verified = charities.find((charity) => charity.id === verifiedId);
    expect(verified.country).toBe("PT");
  });

  it("rejects an unverified charity", async () => {
    const response = await fetch(
      `${baseUrl}/api/clubs/me/listings`,
      authed(clubToken, "POST", {
        categoryId,
        title: REJECTED_TITLE,
        description: "This listing tries to use an unverified charity.",
        charitableOrganizationId: unverifiedId,
        donationPercentage: 10,
      }),
    );

    expect(response.status).toBe(400);
    expect(((await response.json()) as any).error).toBe("invalid_charitable_organization");
  });

  it("associates a verified charity and donation percentage with the auction", async () => {
    const response = await fetch(
      `${baseUrl}/api/clubs/me/listings`,
      authed(clubToken, "POST", {
        categoryId,
        title: LISTING_TITLE,
        description: "A listing that supports a verified charity.",
        charitableOrganizationId: verifiedId,
        donationPercentage: 15,
      }),
    );
    const listing: any = await response.json();

    expect(response.status).toBe(201);
    expect(listing.charitableOrganizationId).toBe(verifiedId);
    expect(listing.donationPercentage).toBe(15);
    expect(listing.charitableOrganization.name).toBe(VERIFIED_NAME);
    listingId = listing.id;
  });

  it("returns the charity and donation percentage in the public auction details", async () => {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "verified", verifiedAt: new Date() },
    });

    const response = await fetch(`${baseUrl}/api/listings/${listingId}`);
    const listing: any = await response.json();

    expect(response.status).toBe(200);
    expect(listing.charity).toMatchObject({
      id: verifiedId,
      name: VERIFIED_NAME,
      description: "A verified charity.",
      country: "PT",
      logoUrl: "/images/charities/goal-for-kids.svg",
    });
    expect(listing.donationPercentage).toBe(15);
  });
});
