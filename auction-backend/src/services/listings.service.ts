import type { ListingRow } from "../models/listing.model";
import { getLiveAuction } from "./auction.service";

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
    currentBid: live?.currentBid ?? row.starting_price,
    auctionEndsAt: live ? new Date(live.endTime) : row.auction_ends_at,
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
