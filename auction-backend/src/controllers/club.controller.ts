import type { Request, Response } from "express";
import * as Club from "../models/club.model";
import * as Listings from "../models/listing.model";
import * as CharitableOrganization from "../models/charitableOrganization.model";
import { EDITABLE_STATUSES_CLUB } from "../models/listing.model";
import { detectImageType, removeUploadedFiles, saveImage, saveImages } from "../utils/imageFiles.ts";
import { AUCTION_SETTING_FIELDS, auctionStatus, clubCanCancel, clubEditMode } from "../services/auctionStatus";
import { refreshRoom } from "../services/auction.service";
import {
  auctionDatesInOrder,
  missingForSubmission,
  normalizeFormBody,
  parseStringList,
  validateListingInput,
  type ListingInput,
  type NewListingInput,
} from "../utils/listingValidation";

// Prisma error codes: P2002 = unique constraint, P2025 = record not found
const hasCode = (e: unknown, code: string) => typeof e === "object" && e !== null && (e as any).code === code;

const NAME_MAX = 80;
const DESCRIPTION_MAX = 1000;

/** GET /api/clubs/me: the logged-in club's own profile, including all its listings. */
export async function getMyClub(req: Request, res: Response) {
  try {
    const club = await Club.findClubByUserId(req.user!.id);
    if (!club) return res.status(404).json({ error: "Club profile not found for this user." });
    return res.json(club);
  } catch (error) {
    console.error("Get my club error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/clubs/me: update name and/or description. Only the fields that are sent are changed.
 * The slug and the approval status can't be changed here, and the logo has its own endpoint.
 */
export async function updateMyClub(req: Request, res: Response) {
  try {
    const { name, description } = req.body ?? {};
    const data: { name?: string; description?: string } = {};

    if (name !== undefined) {
      const value = typeof name === "string" ? name.trim() : "";
      if (value.length < 2 || value.length > NAME_MAX)
        return res.status(400).json({ error: `Name must be 2 to ${NAME_MAX} characters.` });
      data.name = value;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length > DESCRIPTION_MAX)
        return res.status(400).json({ error: `Description must be text up to ${DESCRIPTION_MAX} characters.` });
      data.description = description.trim();
    }

    if (Object.keys(data).length === 0)
      return res.status(400).json({ error: "Send at least one of: name, description." });

    const club = await Club.updateClubByUserId(req.user!.id, data);
    return res.json({ message: "Club profile updated successfully.", club });
  } catch (error) {
    if (hasCode(error, "P2025")) return res.status(404).json({ error: "Club profile not found for this user." });
    if (hasCode(error, "P2002")) return res.status(409).json({ error: "A club with this name already exists." });
    console.error("Update my club error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/clubs/me/logo: the request body is the image file itself (PNG, JPEG or WebP, max 2 MB).
 * The file is saved to disk and the club's logoUrl is set to its path, e.g. /uploads/logos/club-3-1731900000000-ab12cd34.png
 */
export async function uploadMyLogo(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0)
      return res.status(400).json({ error: "Send the image as the request body with Content-Type image/png, image/jpeg or image/webp." });

    if (!detectImageType(body)) return res.status(400).json({ error: "The file must be a PNG, JPEG or WebP image." });

    const club = await Club.findClubLogo(req.user!.id);
    if (!club) return res.status(404).json({ error: "Club profile not found for this user." });

    const logoUrl = await saveImage(body, "logos", `club-${club.id}`);
    try {
      await Club.setClubLogo(req.user!.id, logoUrl);
    } catch (error) {
      await removeUploadedFiles([logoUrl]); // don't leave an orphan file if the database update failed
      throw error;
    }
    await removeUploadedFiles([club.logoUrl]);

    return res.json({ logoUrl });
  } catch (error) {
    console.error("Upload club logo error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** DELETE /api/clubs/me/logo: removes the logo. */
export async function removeMyLogo(req: Request, res: Response) {
  try {
    const club = await Club.findClubLogo(req.user!.id);
    if (!club) return res.status(404).json({ error: "Club profile not found for this user." });

    await Club.setClubLogo(req.user!.id, null);
    await removeUploadedFiles([club.logoUrl]);
    return res.json({ logoUrl: null });
  } catch (error) {
    console.error("Remove club logo error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}


// ---------------------------------------------------------------------------
// OWN LISTINGS, under /api/clubs/me/listings
// Routes run requireAuth, requireRole("CLUB") and requireApprovedClub first, so req.user.clubId is always set and the club is approved.
// A listing of another club is answered with 404, the same as a listing that doesn't exist.
// ---------------------------------------------------------------------------

export const STATUSES = ["draft", "pending_verification", "verified", "rejected"];

// P2003 = foreign key (unknown category)

function parseId(req: Request) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Prisma returns prices as Decimal; the API returns plain numbers. */
type PresentableListing = {
  startingPrice: { toNumber(): number } | null;
  status: string;
  auctionStartsAt: Date | null;
  auctionEndsAt: Date | null;
  cancelledAt: Date | null;
};

/**
 * Prisma returns prices as Decimal; the API returns plain numbers. Also adds the auction status
 * (null while the listing isn't verified and not cancelled, because its auction hasn't been approved)
 * and whether the club may still cancel it.
 */
export function present<T extends PresentableListing>(row: T) {
  const status =
    row.status === "verified" || row.cancelledAt
      ? auctionStatus({ startsAt: row.auctionStartsAt, endsAt: row.auctionEndsAt, cancelledAt: row.cancelledAt })
      : null;
  return {
    ...row,
    startingPrice: row.startingPrice ? row.startingPrice.toNumber() : null,
    auctionStatus: status,
    canCancel: clubCanCancel(row),
    editMode: clubEditMode(row),
  };
}

function writeError(res: Response, error: unknown, label: string) {
  if (hasCode(error, "P2002")) return res.status(409).json({ error: "title_taken" });
  if (hasCode(error, "P2003")) return res.status(400).json({ error: "unknown_category" });
  console.error(`${label} error:`, (error as Error).message);
  return res.status(500).json({ error: "Internal server error." });
}

/** A club may only associate its listing with a verified charitable organization. */
async function charityIsSelectable(id: number | null | undefined) {
  if (id === undefined || id === null) return true;
  return Boolean(await CharitableOrganization.findVerifiedById(id));
}

/** GET /api/clubs/me/listings?status=&page=&limit= */
export async function listMyListings(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    let status: string | undefined;
    if (req.query.status !== undefined) {
      if (typeof req.query.status !== "string" || !STATUSES.includes(req.query.status))
        return res.status(400).json({ error: "invalid_status" });
      status = req.query.status;
    }

    const { items, total } = await Listings.listOwn(req.user!.clubId!, { status, skip: (page - 1) * limit, take: limit });
    return res.json({ items: items.map(present), page, limit, total });
  } catch (error) {
    return writeError(res, error, "List my listings");
  }
}

/** GET /api/clubs/me/listings/:id */
export async function getMyListing(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "invalid_id" });

    const listing = await Listings.findOwn(id, req.user!.clubId!);
    if (!listing) return res.status(404).json({ error: "not_found" });
    // The details page also shows how the auction is going
    return res.json({ ...present(listing), ...(await Listings.bidSummary(id)) });
  } catch (error) {
    return writeError(res, error, "Get my listing");
  }
}

const IMAGE_LIMIT = 10;

type UploadedFile = { buffer: Buffer };

/** Files sent in a multipart field (multer puts them in req.files). */
function uploadedFiles(req: Request, field: "images" | "evidenceImages"): UploadedFile[] {
  const files = req.files as Record<string, UploadedFile[]> | undefined;
  return files?.[field] ?? [];
}

/** Text fields: multipart sends everything as text, so it is converted first. JSON bodies are used as they are. */
function listingBody(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return req.is("multipart/form-data") ? normalizeFormBody(body) : body;
}

const allAreImages = (files: UploadedFile[]) => files.every((f) => detectImageType(f.buffer) !== null);

/**
 * POST /api/clubs/me/listings
 * Send multipart/form-data (or JSON when there are no images). Required: categoryId, title, description.
 * Images: file fields "images" and "evidenceImages" (PNG, JPEG or WebP, max 2 MB and 10 files each).
 * New listings start as "draft". Send status "pending_verification" to submit right away
 * (needs startingPrice, auctionEndsAt and at least one image).
 */
export async function createMyListing(req: Request, res: Response) {
  let saved: string[] = [];
  try {
    const parsed = validateListingInput(listingBody(req), "create");
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const input = parsed.value as NewListingInput;

    const images = uploadedFiles(req, "images");
    const evidence = uploadedFiles(req, "evidenceImages");
    if (!allAreImages([...images, ...evidence])) return res.status(400).json({ error: "invalid_image" });
    if (!(await charityIsSelectable(input.charitableOrganizationId)))
      return res.status(400).json({ error: "invalid_charitable_organization" });

    if (input.status === "pending_verification") {
      const missing = missingForSubmission({ ...input, imageCount: images.length });
      if (missing.length) return res.status(400).json({ error: "incomplete_listing", missing });
    }

    saved = await saveImages([...images, ...evidence].map((f) => f.buffer), "listings", `listing-${req.user!.clubId}`);
    const imagePaths = saved.slice(0, images.length);
    const evidencePaths = saved.slice(images.length);

    const listing = await Listings.createOwn(req.user!.clubId!, {
      ...input,
      ...(imagePaths.length ? { images: imagePaths } : {}),
      ...(evidencePaths.length ? { evidenceImages: evidencePaths } : {}),
    });
    return res.status(201).json(present(listing));
  } catch (error) {
    await removeUploadedFiles(saved); // the listing wasn't saved, so don't keep its files
    return writeError(res, error, "Create listing");
  }
}

/**
 * PATCH /api/clubs/me/listings/:id: send only the fields to change (multipart/form-data, or JSON without images).
 * New files in "images" / "evidenceImages" are added to the existing ones. To delete existing images, send
 * "removeImages" / "removeEvidenceImages" with their paths (JSON array, comma separated, or repeated field).
 * "draft" and "rejected" listings can be fully edited; editing a rejected listing makes it a draft again.
 * A verified listing whose auction is still scheduled only accepts the auction settings (see clubEditMode).
 * Anything else is locked: pending verification, an auction that already opened, finished or was cancelled.
 */
export async function updateMyListing(req: Request, res: Response) {
  let saved: string[] = [];
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "invalid_id" });
    const clubId = req.user!.clubId!;

    const existing = await Listings.findOwn(id, clubId);
    if (!existing) return res.status(404).json({ error: "not_found" });
    if (existing.cancelledAt) return res.status(409).json({ error: "listing_cancelled" });
    const mode = clubEditMode(existing);
    if (mode === "auction") return updateScheduledAuction(req, res, existing);
    if (mode !== "full" || !EDITABLE_STATUSES_CLUB.includes(existing.status))
      return res.status(409).json({ error: "listing_locked" });

    // Images to delete: they must be images of this listing
    const removeImages = parseStringList(req.body?.removeImages);
    const removeEvidence = parseStringList(req.body?.removeEvidenceImages);
    if (!removeImages || !removeEvidence) return res.status(400).json({ error: "invalid_remove_images" });
    if (
        removeImages.some((p) => !existing.images.includes(p)) ||
        removeEvidence.some((p) => !existing.evidenceImages.includes(p))
    )
      return res.status(400).json({ error: "invalid_remove_images" });

    const newImages = uploadedFiles(req, "images");
    const newEvidence = uploadedFiles(req, "evidenceImages");
    if (!allAreImages([...newImages, ...newEvidence])) return res.status(400).json({ error: "invalid_image" });

    const imagesChanged = newImages.length > 0 || removeImages.length > 0;
    const evidenceChanged = newEvidence.length > 0 || removeEvidence.length > 0;

    const parsed = validateListingInput(listingBody(req), "update");
    let input: ListingInput;
    if (parsed.ok) input = parsed.value;
    else if (parsed.error === "no_fields" && (imagesChanged || evidenceChanged)) input = {}; // only images changed
    else return res.status(400).json({ error: parsed.error });

    if (!(await charityIsSelectable(input.charitableOrganizationId)))
      return res.status(400).json({ error: "invalid_charitable_organization" });

    // Only one of the two dates may have been sent: compare with the saved one
    const startsAt = input.auctionStartsAt !== undefined ? input.auctionStartsAt : existing.auctionStartsAt;
    const endsAt = input.auctionEndsAt !== undefined ? input.auctionEndsAt : existing.auctionEndsAt;
    if (!auctionDatesInOrder(startsAt, endsAt)) return res.status(400).json({ error: "auction_starts_after_end" });

    const keptImages = existing.images.filter((p) => !removeImages.includes(p));
    const keptEvidence = existing.evidenceImages.filter((p) => !removeEvidence.includes(p));
    if (keptImages.length + newImages.length > IMAGE_LIMIT || keptEvidence.length + newEvidence.length > IMAGE_LIMIT)
      return res.status(400).json({ error: "too_many_images" });

    if (existing.status === "rejected" && input.status === undefined) input.status = "draft";

    if (input.status === "pending_verification") {
      const missing = missingForSubmission({
        startingPrice: existing.startingPrice?.toNumber() ?? null,
        auctionEndsAt: existing.auctionEndsAt,
        ...input,
        imageCount: keptImages.length + newImages.length,
      });
      if (missing.length) return res.status(400).json({ error: "incomplete_listing", missing });
    }

    saved = await saveImages([...newImages, ...newEvidence].map((f) => f.buffer), "listings", `listing-${clubId}`);
    if (imagesChanged) input.images = [...keptImages, ...saved.slice(0, newImages.length)];
    if (evidenceChanged) input.evidenceImages = [...keptEvidence, ...saved.slice(newImages.length)];

    const changed = await Listings.updateOwn(id, clubId, input);
    if (changed === 0) {
      await removeUploadedFiles(saved);
      return res.status(409).json({ error: "listing_locked" }); // status changed in the meantime
    }

    await removeUploadedFiles([...removeImages, ...removeEvidence]); // the database no longer points to them

    const updated = await Listings.findOwn(id, clubId);
    return res.json(present(updated!));
  } catch (error) {
    await removeUploadedFiles(saved);
    return writeError(res, error, "Update listing");
  }
}

/**
 * Edit of a verified listing whose auction hasn't opened yet: only the auction settings can change.
 * The item (title, photos, authenticity...) was approved by an admin and stays as it is. The auction
 * must keep a starting price, a start date in the future and an end date after it.
 */
async function updateScheduledAuction(
  req: Request,
  res: Response,
  existing: NonNullable<Awaited<ReturnType<typeof Listings.findOwn>>>
) {
  const files = uploadedFiles(req, "images").length + uploadedFiles(req, "evidenceImages").length;
  const removals = [...(parseStringList(req.body?.removeImages) ?? []), ...(parseStringList(req.body?.removeEvidenceImages) ?? [])];
  if (files > 0 || removals.length > 0) return res.status(409).json({ error: "only_auction_settings", fields: ["images"] });

  const parsed = validateListingInput(listingBody(req), "update");
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const input = parsed.value;

  const notAllowed = Object.keys(input).filter((key) => !(AUCTION_SETTING_FIELDS as readonly string[]).includes(key));
  if (notAllowed.length) return res.status(409).json({ error: "only_auction_settings", fields: notAllowed });

  if (!(await charityIsSelectable(input.charitableOrganizationId)))
    return res.status(400).json({ error: "invalid_charitable_organization" });

  const startsAt = input.auctionStartsAt !== undefined ? input.auctionStartsAt : existing.auctionStartsAt;
  const endsAt = input.auctionEndsAt !== undefined ? input.auctionEndsAt : existing.auctionEndsAt;
  const startingPrice = input.startingPrice !== undefined ? input.startingPrice : existing.startingPrice;

  // Removing the start date would open the auction straight away, which is not an edit "before it starts"
  if (!startsAt) return res.status(400).json({ error: "auction_start_required" });
  const missing = [...(startingPrice ? [] : ["startingPrice"]), ...(endsAt ? [] : ["auctionEndsAt"])];
  if (missing.length) return res.status(400).json({ error: "incomplete_listing", missing });
  if (!auctionDatesInOrder(startsAt, endsAt)) return res.status(400).json({ error: "auction_starts_after_end" });

  const id = existing.id;
  const clubId = req.user!.clubId!;
  const changed = await Listings.updateScheduledAuction(id, clubId, input);
  if (changed === 0) return res.status(409).json({ error: "auction_already_open" }); // it opened in the meantime

  await refreshRoom(req.app.get("io"), id); // anyone on the auction page sees the new countdown
  const updated = await Listings.findOwn(id, clubId);
  return res.json(present(updated!));
}

/** DELETE /api/clubs/me/listings/:id. Verified listings can't be deleted. Its image files are deleted too. */
/**
 * POST /api/clubs/me/listings/:id/cancel
 * A club can cancel its approved auction while it is still scheduled. Before approval there is nothing to
 * cancel: the club deletes the listing instead. Once the auction has opened, only an admin can cancel it.
 */
export async function cancelMyListing(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "invalid_id" });

    const existing = await Listings.findOwn(id, req.user!.clubId!);
    if (!existing) return res.status(404).json({ error: "not_found" });
    if (existing.cancelledAt) return res.status(409).json({ error: "already_cancelled" });
    if (existing.status !== "verified") return res.status(409).json({ error: "not_verified" });
    if (!clubCanCancel(existing)) return res.status(409).json({ error: "auction_already_open" });

    const listing = await Listings.cancelListing(id);
    if (!listing) return res.status(409).json({ error: "already_cancelled" });

    await refreshRoom(req.app.get("io"), id);
    return res.json(present(listing));
  } catch (error) {
    return writeError(res, error, "Cancel listing");
  }
}

export async function deleteMyListing(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "invalid_id" });
    const clubId = req.user!.clubId!;

    const existing = await Listings.findOwn(id, clubId);
    if (!existing) return res.status(404).json({ error: "not_found" });

    const deleted = await Listings.deleteOwn(id, clubId);
    if (deleted === 0) return res.status(409).json({ error: "listing_locked" });

    await removeUploadedFiles([...existing.images, ...existing.evidenceImages]);
    return res.status(204).send();
  } catch (error) {
    return writeError(res, error, "Delete listing");
  }
}