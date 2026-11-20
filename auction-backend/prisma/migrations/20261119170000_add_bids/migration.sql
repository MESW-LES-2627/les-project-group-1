create table if not exists bids(
  id serial primary key,
  listing_id integer not null references listings(id) on delete cascade,
  bidder text not null,
  country text,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists bids_listing_id_created_at_idx
  on bids(listing_id, created_at);
