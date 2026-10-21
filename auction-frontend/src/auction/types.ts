//Represents a bid made by a user in the auction.
export interface Bid {
  bidder: string;
  amount: number;
  timestamp: number;
  country?: string;
}

//Current status and ddetails of the live action.
export interface AuctionState {
  itemName: string;
  currentBid: number;
  highestBidder: string | null;
  endTime: number;
  isActive: boolean;
  bidCount?: number;
  bids?: Bid[];
}

//Result data shown when the auction finishes.
export interface WinnerData {
  winner: string | null;
  winningBid: number;
}
