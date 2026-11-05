import AuctionApp from '../auction/AuctionApp';
import { ProfileView } from './ProfileView';

export function ProfilePage() {
  return <AuctionApp renderPage={(account) => <ProfileView account={account} />} />;
}