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

create table if not exists sessions (
  token text primary key,
  user_id integer not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table users add column if not exists avatar text;