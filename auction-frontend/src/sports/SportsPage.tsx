import AuctionApp from '../auction/AuctionApp';
import { SportsView } from './SportsView';

export function SportsPage() {
  return <AuctionApp renderPage={(account) => <SportsView account={account} />} />;
}