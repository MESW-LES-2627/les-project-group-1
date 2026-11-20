-- Verified charities, their country, and the donation share chosen by the club for each auction.
ALTER TABLE "charitable_organizations"
    ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "listings"
    ADD COLUMN IF NOT EXISTS "donation_percentage" INTEGER;

ALTER TABLE "listings"
    DROP CONSTRAINT IF EXISTS "listings_donation_percentage_check";
ALTER TABLE "listings"
    ADD CONSTRAINT "listings_donation_percentage_check"
    CHECK ("donation_percentage" IS NULL OR ("donation_percentage" >= 0 AND "donation_percentage" <= 100));

-- Expose the associated charity and donation percentage to the public catalogue.
DROP VIEW IF EXISTS public_listings;

CREATE VIEW public_listings AS
  SELECT
    l.id, l.title, l.player_name, l.player_details, l.season, l.competition, l.match, l.tags,
    l.description, l.images, l.authenticity_notes, l.evidence_images, l.certificate_code,
    l.verified_at, l.starting_price::float8 AS starting_price, l.auction_ends_at,
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
