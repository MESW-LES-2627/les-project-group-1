alter table listings add column if not exists match text;

drop view if exists public_listings;

create view public_listings as
  select
    l.id, l.title, l.player_name, l.player_details, l.season, l.competition, l.match, l.tags,
    l.description, l.images, l.authenticity_notes, l.evidence_images, l.certificate_code,
    l.verified_at, l.starting_price::float8 as starting_price, l.auction_ends_at,
    c.slug as club_slug, c.name as club_name, c.logo_url as club_logo_url,
    cat.slug as category_slug, cat.name as category_name
  from listings l
  join clubs c on c.id = l.club_id
  join categories cat on cat.id = l.category_id
  where l.status = 'verified';
