import AuctionApp from '../auction/AuctionApp';
import { AboutView } from './AboutView';

export function AboutPage() {
  return <AuctionApp renderPage={(account) => <AboutView account={account} />} />;
}