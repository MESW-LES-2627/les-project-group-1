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

/** A club can cancel its own auction while it hasn't been verified yet, or while it is still scheduled. */
export function clubCanCancel(listing: {
  status: string;
  auctionStartsAt: DateLike;
  auctionEndsAt: DateLike;
  cancelledAt: DateLike;
}, now = Date.now()) {
  if (time(listing.cancelledAt) !== null) return false;
  if (listing.status !== "verified") return true;
  return auctionStatus({ startsAt: listing.auctionStartsAt, endsAt: listing.auctionEndsAt }, now) === "scheduled";
}

/** An admin can cancel any auction that hasn't finished or been cancelled already. */
export function adminCanCancel(listing: { auctionStartsAt: DateLike; auctionEndsAt: DateLike; cancelledAt: DateLike }, now = Date.now()) {
  const status = auctionStatus(
    { startsAt: listing.auctionStartsAt, endsAt: listing.auctionEndsAt, cancelledAt: listing.cancelledAt },
    now
  );
  return status === "scheduled" || status === "active";
}
