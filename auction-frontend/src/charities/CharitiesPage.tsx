import AuctionApp from '../auction/AuctionApp';
import { CharitiesView } from './CharitiesView';

export function CharitiesPage() {
  return <AuctionApp renderPage={(account) => <CharitiesView account={account} />} />;
}