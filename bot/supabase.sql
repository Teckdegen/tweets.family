create table if not exists accounts (
  x_user_id text primary key,
  username text not null,
  created_at timestamptz not null default now()
);

create table if not exists creators (
  x_user_id text primary key,
  username text not null unique
);

create table if not exists bot_state (
  id int primary key default 1 check (id = 1),
  since_id text,
  access_token text,
  refresh_token text
);

alter table bot_state add column if not exists access_token text;
alter table bot_state add column if not exists refresh_token text;

insert into bot_state (id, since_id)
values (1, null)
on conflict (id) do nothing;

create table if not exists seen_mentions (
  mention_id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists trades (
  mention_id text primary key,
  user_id text not null,
  username text,
  tweet_id text not null,
  stake numeric not null,
  leverage int not null,
  minutes int not null,
  entry numeric not null,
  target numeric not null,
  back numeric not null,
  fee numeric not null,
  final numeric,
  status text not null,
  opened_at timestamptz not null,
  expires_at timestamptz not null,
  settled_at timestamptz
);

alter table accounts add column if not exists wallet_address text;

alter table bot_state add column if not exists house_wallet_id text;
alter table bot_state add column if not exists house_wallet_address text;

create table if not exists leaderboard (
  x_user_id text primary key,
  username text,
  trades int not null default 0,
  wins int not null default 0,
  pnl numeric not null default 0,
  biggest_win numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_pnl_idx on leaderboard (pnl desc);
create index if not exists trades_won_back_idx on trades (back desc);

alter table accounts enable row level security;
alter table leaderboard enable row level security;
alter table creators enable row level security;
alter table bot_state enable row level security;
alter table seen_mentions enable row level security;
alter table trades enable row level security;
