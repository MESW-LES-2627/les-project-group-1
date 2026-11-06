import type { AccountNav } from '../auction/types';
import { AccountProfile } from '../components/AccountProfile';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';

export function ProfileView({ account }: { account: AccountNav }) {
  return (
    <>
      <Navbar {...account} />
      {account.isLoggedIn ? (
        <AccountProfile
          token={account.token}
          username={account.username}
          email={account.email}
          country={account.country}
          onSaved={account.onProfileSaved}
        />
      ) : (
        <div className="mx-auto mt-10 max-w-md space-y-4 p-6 text-center">
          <p>Log in to see your profile.</p>
          <Button variant="solid" size="form" onClick={account.onLoginClick}>
            LOG IN
          </Button>
        </div>
      )}
    </>
  );
}