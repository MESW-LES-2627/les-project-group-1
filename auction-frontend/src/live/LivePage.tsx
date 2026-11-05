import AuctionApp from '../auction/AuctionApp';
import { LiveView } from './LiveView';

export function LivePage() {
  return <AuctionApp renderPage={(account) => <LiveView account={account} />} />;
}