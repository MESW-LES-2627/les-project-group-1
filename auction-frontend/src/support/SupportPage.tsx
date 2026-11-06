import AuctionApp from '../auction/AuctionApp';
import { SupportView } from './SupportView';

export function SupportPage() {
  return <AuctionApp renderPage={(account) => <SupportView account={account} />} />;
}