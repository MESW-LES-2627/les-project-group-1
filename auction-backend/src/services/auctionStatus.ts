/**
 * The status of an auction, worked out from its dates instead of being stored, so it changes on its
 * own when a date is reached (even after a server restart):
 *
 *   cancelled  cancelledAt is set (by an admin, or by the club before the auction opens)
 *   scheduled  the start date has not been reached yet
 *   completed  the end date has been reached
 *   active     otherwise: bids are accepted
 *
 * This is separate from the listing status (draft, pending_verification, verified, rejected), which only
 * says whether an admin approved the item. A listing is only public, and its auction only open, once verified.
 */

export const AUCTION_STATUSES = ["scheduled", "active", "completed", "cancelled"] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

type DateLike = Date | number | string | null | undefined;

const time = (value: DateLike) => (value === null || value === undefined ? null : new Date(value).getTime());

export function auctionStatus(
  dates: { startsAt: DateLike; endsAt: DateLike; cancelledAt?: DateLike },
  now = Date.now()
): AuctionStatus {
  if (time(dates.cancelledAt) !== null) return "cancelled";
  const startsAt = time(dates.startsAt);
  if (startsAt !== null && now < startsAt) return "scheduled";
  const endsAt = time(dates.endsAt);
  if (endsAt !== null && now >= endsAt) return "completed";
  return "active";
}

/*
 * Each action has one meaning, at one stage of a listing:
 *   delete  the club removes something of its own that was never public (draft, pending, rejected)
 *   reject  the admin sends a listing under review back to the club to fix and resubmit
 *   cancel  an approved (verified) auction is stopped for good, and stays on record as cancelled
 */

/** A club can cancel its own auction once it is approved, while it is still scheduled. Before that, it deletes it. */
export function clubCanCancel(listing: {
  status: string;
  auctionStartsAt: DateLike;
  auctionEndsAt: DateLike;
  cancelledAt: DateLike;
}, now = Date.now()) {
  if (time(listing.cancelledAt) !== null || listing.status !== "verified") return false;
  return auctionStatus({ startsAt: listing.auctionStartsAt, endsAt: listing.auctionEndsAt }, now) === "scheduled";
}

/** An admin can cancel an approved auction while it is scheduled or active. A listing under review is rejected instead. */
export function adminCanCancel(
  listing: { status: string; auctionStartsAt: DateLike; auctionEndsAt: DateLike; cancelledAt: DateLike },
  now = Date.now()
) {
  if (listing.status !== "verified") return false;
  const status = auctionStatus(
    { startsAt: listing.auctionStartsAt, endsAt: listing.auctionEndsAt, cancelledAt: listing.cancelledAt },
    now
  );
  return status === "scheduled" || status === "active";
}

/** The auction settings a club can still change once the item is verified, while the auction is scheduled. */
export const AUCTION_SETTING_FIELDS = [
  "startingPrice",
  "auctionStartsAt",
  "auctionEndsAt",
  "charitableOrganizationId",
  "donationPercentage",
] as const;

/**
 * What a club can edit:
 *   "full"     drafts and rejected listings: everything (the admin hasn't approved the item yet)
 *   "auction"  verified listings whose auction is still scheduled: only the auction settings, because the
 *              item itself was already checked by the admin
 *   null       nothing: pending verification, already open, finished or cancelled
 */
export function clubEditMode(
  listing: { status: string; auctionStartsAt: DateLike; auctionEndsAt: DateLike; cancelledAt: DateLike },
  now = Date.now()
): "full" | "auction" | null {
  if (time(listing.cancelledAt) !== null) return null;
  if (listing.status === "draft" || listing.status === "rejected") return "full";
  if (listing.status !== "verified") return null;
  const status = auctionStatus({ startsAt: listing.auctionStartsAt, endsAt: listing.auctionEndsAt }, now);
  return status === "scheduled" ? "auction" : null;
}
