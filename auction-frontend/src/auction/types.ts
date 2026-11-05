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

//Player profile shown on the player card.
export interface PlayerInfo {
  name: string;
  nickname: string;
  age: number;
  position: string;
  number: number;
  size: string;
  nationality: string;
  placeOfBirth: string;
  preferredFoot: string;
}

//Charitable cause supported by an auction.
export interface Cause {
  name: string;
  description: string;
  logo: string;
}

//Item data shown on the auction page (tags, subtitle, images, player and causes).
export interface AuctionItem {
  subtitle: string;
  tags: string[];
  images: string[];
  player: PlayerInfo | null;
  causes: Cause[];
}

//Account actions shown in the navigation bar (login, sign up and logout).
export interface AccountNav {
  isLoggedIn: boolean;
  onSignUpClick: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
}