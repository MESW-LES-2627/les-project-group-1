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