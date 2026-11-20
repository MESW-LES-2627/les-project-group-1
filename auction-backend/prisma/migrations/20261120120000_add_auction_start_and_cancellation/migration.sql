-- Auction lifecycle: the club picks when the auction opens, and an auction can be cancelled.
-- The auction status itself (scheduled, active, completed, cancelled) is not stored: it is worked out
-- from these dates, so it changes on its own when a date is reached.
ALTER TABLE "listings"
    ADD COLUMN IF NOT EXISTS "auction_starts_at" TIMESTAMPTZ(6),
    ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ(6);

-- Listings verified before this change started when they were verified.
UPDATE "listings"
SET "auction_starts_at" = "verified_at"
WHERE "auction_starts_at" IS NULL AND "verified_at" IS NOT NULL;

-- Expose the start and cancellation dates to the public catalogue.
DROP VIEW IF EXISTS public_listings;

CREATE VIEW public_listings AS
  SELECT
    l.id, l.title, l.player_name, l.player_details, l.season, l.competition, l.match, l.tags,
    l.description, l.images, l.authenticity_notes, l.evidence_images, l.certificate_code,
    l.verified_at, l.starting_price::float8 AS starting_price, l.auction_ends_at,
    l.auction_starts_at, l.cancelled_at,
    l.charitable_organization_id, l.donation_percentage,
    c.slug AS club_slug, c.name AS club_name, c.logo_url AS club_logo_url,
    cat.slug AS category_slug, cat.name AS category_name,
    co.id AS charity_id, co.name AS charity_name, co.description AS charity_description,
    co.logo_url AS charity_logo_url, co.country AS charity_country
  FROM listings l
  JOIN clubs c ON c.id = l.club_id
  JOIN categories cat ON cat.id = l.category_id
  LEFT JOIN charitable_organizations co ON co.id = l.charitable_organization_id
  WHERE l.status = 'verified';
