import type { ListingRow } from "../models/listing.model";
import { getLiveAuction } from "./auction.service";
import { auctionStatus } from "./auctionStatus";

/** Maps database rows to the JSON the catalogue API returns. */

// Summary shown on catalogue cards. Uses live bid/end time when the auction is open.
export function toSummary(row: ListingRow) {
  const live = getLiveAuction(row.id);
  return {
    id: row.id,
    title: row.title,
    playerName: row.player_name,
    season: row.season,
    competition: row.competition,
    match: row.match,
    tags: row.tags,
    images: row.images,
    club: { slug: row.club_slug, name: row.club_name, logoUrl: row.club_logo_url },
    category: { slug: row.category_slug, name: row.category_name },
    charity: row.charity_id
      ? {
          id: row.charity_id,
          name: row.charity_name,
          description: row.charity_description,
          logoUrl: row.charity_logo_url,
          country: row.charity_country,
        }
      : null,
    donationPercentage: row.donation_percentage,
    currentBid: live?.currentBid ?? row.starting_price,
    auctionStartsAt: row.auction_starts_at ?? row.verified_at,
    auctionEndsAt: live ? new Date(live.endTime) : row.auction_ends_at,
    // The open room knows if the auction was closed early; otherwise the dates decide
    auctionStatus:
      live?.status ??
      auctionStatus({
        startsAt: row.auction_starts_at ?? row.verified_at,
        endsAt: row.auction_ends_at,
        cancelledAt: row.cancelled_at,
      }),
  };
}

// Full detail shown on the item page, including authenticity data.
export function toDetail(row: ListingRow) {
  return {
    ...toSummary(row),
    description: row.description,
    player: row.player_name && row.player_details ? { name: row.player_name, ...row.player_details } : null,
    authenticityNotes: row.authenticity_notes,
    evidenceImages: row.evidence_images,
    certificateCode: row.certificate_code,
    verifiedAt: row.verified_at,
  };
}
