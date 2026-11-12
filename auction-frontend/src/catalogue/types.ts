import type { PlayerInfo } from '@/auction/types';

// Category used to browse and filter the catalogue.
export interface Category {
  slug: string;
  name: string;
}

// Short listing data shown on catalogue cards.
export interface ListingSummary {
  id: number;
  title: string;
  playerName: string | null;
  season: string | null;
  competition: string | null;
  match: string | null;
  tags: string[];
  images: string[];
  club: { slug: string; name: string; logoUrl: string | null };
  category: Category;
  currentBid: number | null;
  auctionEndsAt: string | null;
}

// Full listing data shown on the item detail page, including authenticity evidence.
export interface ListingDetail extends ListingSummary {
  description: string;
  player: PlayerInfo | null;
  authenticityNotes: string | null;
  evidenceImages: string[];
  certificateCode: string | null;
  verifiedAt: string | null;
}

// Club profile with the verified listings it offers.
export interface ClubDetail {
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  listings: ListingSummary[];
}