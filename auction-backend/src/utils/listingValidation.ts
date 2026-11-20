/** Validation for listings created or edited by a club. Errors are short codes, like profileValidation. */

export type ListingInput = {
  categoryId?: number;
  title?: string;
  playerName?: string | null;
  playerDetails?: Record<string, string | number> | null;
  season?: string | null;
  competition?: string | null;
  match?: string | null;
  tags?: string[];
  description?: string;
  /** Set by the controller from uploaded files, never read from the request body. */
  images?: string[];
  authenticityNotes?: string | null;
  evidenceImages?: string[];
  startingPrice?: number | null;
  /** When the auction opens. Optional: without it, the auction opens as soon as an admin verifies it. */
  auctionStartsAt?: Date | null;
  auctionEndsAt?: Date | null;
  /** The verified charity supported by this auction. null clears the selection. */
  charitableOrganizationId?: number | null;
  /** Share of the winning bid donated to the selected charity (0-100). */
  donationPercentage?: number | null;
  /** Clubs can only move a listing between these two. "verified" and "rejected" are set by an admin. */
  status?: "draft" | "pending_verification";
};

export type NewListingInput = ListingInput & { categoryId: number; title: string; description: string };

export type ListingValidation =
    | { ok: true; value: ListingInput }
    | { ok: false; error: string };

type Field<T> = { ok: true; value: T } | { ok: false };
const bad = { ok: false } as const;
const fail = (error: string) => ({ ok: false, error }) as const;

function text(v: unknown, min: number, max: number): Field<string> {
  if (typeof v !== "string") return bad;
  const t = v.trim();
  return t.length >= min && t.length <= max ? { ok: true, value: t } : bad;
}

/** null or a string up to max characters. An empty string becomes null. */
function optionalText(v: unknown, max: number): Field<string | null> {
  if (v === null) return { ok: true, value: null };
  if (typeof v !== "string") return bad;
  const t = v.trim();
  return t.length <= max ? { ok: true, value: t || null } : bad;
}

function tagList(v: unknown): Field<string[]> {
  if (!Array.isArray(v) || v.length > 10) return bad;
  const tags: string[] = [];
  for (const item of v) {
    const t = text(item, 1, 30);
    if (!t.ok) return bad;
    if (!tags.includes(t.value)) tags.push(t.value);
  }
  return { ok: true, value: tags };
}

function playerDetails(v: unknown): Field<Record<string, string | number> | null> {
  if (v === null) return { ok: true, value: null };
  if (typeof v !== "object" || Array.isArray(v)) return bad;
  const entries = Object.entries(v);
  if (entries.length > 20) return bad;
  const result: Record<string, string | number> = {};
  for (const [key, val] of entries) {
    if (key.length < 1 || key.length > 40) return bad;
    if (typeof val === "number" && Number.isFinite(val)) result[key] = val;
    else if (typeof val === "string" && val.length <= 100) result[key] = val;
    else return bad;
  }
  return { ok: true, value: result };
}

const TEXT_FIELDS = [
  ["playerName", 80, "invalid_player_name"],
  ["season", 20, "invalid_season"],
  ["competition", 100, "invalid_competition"],
  ["match", 100, "invalid_match"],
  ["authenticityNotes", 1000, "invalid_authenticity_notes"],
] as const;

/**
 * "create" needs categoryId, title and description. "update" accepts any subset of the fields
 * (at least one). Fields that are not sent are left out of the result.
 */
export function validateListingInput(body: unknown, mode: "create" | "update"): ListingValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return fail("invalid_body");
  const d = body as Record<string, unknown>;
  const out: ListingInput = {};

  if (d.categoryId !== undefined || mode === "create") {
    if (!Number.isInteger(d.categoryId) || (d.categoryId as number) <= 0) return fail("invalid_category");
    out.categoryId = d.categoryId as number;
  }

  if (d.title !== undefined || mode === "create") {
    const r = text(d.title, 3, 120);
    if (!r.ok) return fail("invalid_title");
    out.title = r.value;
  }

  if (d.description !== undefined || mode === "create") {
    const r = text(d.description, 10, 2000);
    if (!r.ok) return fail("invalid_description");
    out.description = r.value;
  }

  for (const [key, max, error] of TEXT_FIELDS) {
    if (d[key] === undefined) continue;
    const r = optionalText(d[key], max);
    if (!r.ok) return fail(error);
    out[key] = r.value;
  }

  if (d.playerDetails !== undefined) {
    const r = playerDetails(d.playerDetails);
    if (!r.ok) return fail("invalid_player_details");
    out.playerDetails = r.value;
  }

  if (d.tags !== undefined) {
    const r = tagList(d.tags);
    if (!r.ok) return fail("invalid_tags");
    out.tags = r.value;
  }

  if (d.startingPrice !== undefined) {
    const p = d.startingPrice;
    if (p === null) out.startingPrice = null;
    else if (typeof p === "number" && Number.isFinite(p) && p > 0 && p <= 1_000_000) out.startingPrice = Math.round(p * 100) / 100;
    else return fail("invalid_starting_price");
  }

  if (d.auctionStartsAt !== undefined) {
    const v = d.auctionStartsAt;
    if (v === null) out.auctionStartsAt = null;
    else if (typeof v === "string") {
      const date = new Date(v);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return fail("invalid_auction_starts_at");
      out.auctionStartsAt = date;
    } else return fail("invalid_auction_starts_at");
  }

  if (d.auctionEndsAt !== undefined) {
    const v = d.auctionEndsAt;
    if (v === null) out.auctionEndsAt = null;
    else if (typeof v === "string") {
      const date = new Date(v);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return fail("invalid_auction_ends_at");
      out.auctionEndsAt = date;
    } else return fail("invalid_auction_ends_at");
  }

  if (!auctionDatesInOrder(out.auctionStartsAt, out.auctionEndsAt)) return fail("auction_starts_after_end");

  if (d.charitableOrganizationId !== undefined) {
    const v = d.charitableOrganizationId;
    if (v === null) out.charitableOrganizationId = null;
    else if (Number.isInteger(v) && (v as number) > 0) out.charitableOrganizationId = v as number;
    else return fail("invalid_charitable_organization");
  }

  if (d.donationPercentage !== undefined) {
    const v = d.donationPercentage;
    if (v === null) out.donationPercentage = null;
    else if (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100) out.donationPercentage = v as number;
    else return fail("invalid_donation_percentage");
  }

  if (d.status !== undefined) {
    if (d.status !== "draft" && d.status !== "pending_verification") return fail("invalid_status");
    out.status = d.status;
  }

  if (mode === "update" && Object.keys(out).length === 0) return fail("no_fields");
  return { ok: true, value: out };
}

/** The auction must open before it ends. Missing dates can't be out of order. */
export function auctionDatesInOrder(startsAt: Date | null | undefined, endsAt: Date | null | undefined) {
  if (!startsAt || !endsAt) return true;
  return startsAt.getTime() < endsAt.getTime();
}

/** What a listing still needs before it can be sent for verification. Empty list means it is ready. */
export function missingForSubmission(l: {
  startingPrice?: number | null;
  auctionEndsAt?: Date | null;
  imageCount?: number;
}) {
  const missing: string[] = [];
  if (!l.startingPrice) missing.push("startingPrice");
  if (!l.auctionEndsAt || l.auctionEndsAt.getTime() <= Date.now()) missing.push("auctionEndsAt");
  if (!l.imageCount) missing.push("images");
  return missing;
}

/**
 * A list sent as a JSON array, a JSON string like '["a","b"]', a comma separated string "a,b",
 * or a repeated form field. Returns null if it isn't a list of strings.
 */
export function parseStringList(v: unknown): string[] | null {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.every((x) => typeof x === "string") ? v.map((x) => x.trim()).filter(Boolean) : null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t === "") return [];
  if (t.startsWith("[")) {
    try {
      return parseStringList(JSON.parse(t));
    } catch {
      return null;
    }
  }
  return t.split(",").map((x) => x.trim()).filter(Boolean);
}

/**
 * multipart/form-data sends every field as text. This turns the text back into what
 * validateListingInput expects: numbers, null for empty values, a list for tags, an object for playerDetails.
 */
export function normalizeFormBody(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  for (const key of ["categoryId", "startingPrice", "charitableOrganizationId", "donationPercentage"]) {
    const v = out[key];
    if (typeof v === "string") out[key] = v.trim() === "" ? null : Number(v);
  }

  for (const key of ["auctionStartsAt", "auctionEndsAt"]) {
    const v = out[key];
    if (typeof v === "string" && v.trim() === "") out[key] = null;
  }

  if (typeof out.playerDetails === "string") {
    const t = out.playerDetails.trim();
    if (t === "") out.playerDetails = null;
    else {
      try {
        out.playerDetails = JSON.parse(t);
      } catch {
        // left as text: validation rejects it as invalid_player_details
      }
    }
  }

  if (out.tags !== undefined) {
    const list = parseStringList(out.tags);
    if (list) out.tags = list;
  }

  return out;
}