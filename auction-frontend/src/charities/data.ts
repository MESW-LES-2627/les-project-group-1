// Verified charitable organization returned by GET /api/charities.
export interface Charity {
  id: number;
  name: string;
  description: string;
  logoUrl: string | null;
  country: string;
  verified: boolean;
  auctionCount: number;
}
