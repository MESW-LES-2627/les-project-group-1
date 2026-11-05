create table if not exists users(
  id serial primary key,
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  country text not null,
  reset_token text,
  reset_token_expires timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists winners (
  id serial primary key,
  item_name text not null,
  socket_id text not null,
  email text,
  winning_bid numeric(10, 2) not null,
  status text not null default 'pending_payment',
  stripe_session_id text unique,
  ended_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists clubs (
  id serial primary key,
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  slug text not null unique,
  name text not null unique
);

create table if not exists listings (
  id serial primary key,
  club_id integer not null references clubs(id),
  category_id integer not null references categories(id),
  title text not null unique,
  player_name text,
  player_details jsonb,
  season text,
  competition text,
  tags text[] not null default '{}',
  description text not null,
  images text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'pending_verification', 'verified', 'rejected')),
  authenticity_notes text,
  evidence_images text[] not null default '{}',
  certificate_code text unique,
  starting_price numeric(10, 2),
  auction_ends_at timestamptz,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create or replace view public_listings as
  select
    l.id, l.title, l.player_name, l.player_details, l.season, l.competition, l.tags,
    l.description, l.images, l.authenticity_notes, l.evidence_images, l.certificate_code,
    l.verified_at, l.starting_price::float8 as starting_price, l.auction_ends_at,
    c.slug as club_slug, c.name as club_name,
    cat.slug as category_slug, cat.name as category_name
  from listings l
  join clubs c on c.id = l.club_id
  join categories cat on cat.id = l.category_id
  where l.status = 'verified';