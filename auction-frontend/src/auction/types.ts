export interface Bid {
  bidder: string;
  amount: number;
  timestamp: number;
  country?: string;
}

export interface AuctionState {
  itemName: string;
  currentBid: number;
  highestBidder: string | null;
  endTime: number;
  isActive: boolean;
  bidCount?: number;
  bids?: Bid[];
}

export interface WinnerData {
  winner: string | null;
  winningBid: number;
}
