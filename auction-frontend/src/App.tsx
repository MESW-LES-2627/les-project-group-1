import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AuctionApp from './auction/AuctionApp';
import { CataloguePage } from './catalogue/CataloguePage';
import { ClubPage } from './catalogue/ClubPage';
import { ItemPage } from './catalogue/ItemPage';
import { ProfilePage } from './profile/ProfilePage';
import { CharitiesPage } from './charities/CharitiesPage';

/**
 * Root Application Component
 *
 * Defines the application routes:
 * - /                 home page: memorabilia catalogue
 * - /auction/:id      item page with its live auction
 * - /club/:slug       club page
 * - /profile          account page of the logged in user
 * - /reset-password   link sent by email, opens the reset password form
 * - /demo             live auction prototype from Sprint 0
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CataloguePage />} />
        <Route path="/auction/:id" element={<ItemPage />} />
        <Route path="/club/:slug" element={<ClubPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reset-password" element={<CataloguePage />} />
        <Route path="/demo" element={<AuctionApp />} />
        <Route
          path="*"
          element={
            <main className="p-8">
              <p className="mb-3 font-bold">Page not found.</p>
              <Link className="text-link underline" to="/">Back to the catalogue</Link>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;