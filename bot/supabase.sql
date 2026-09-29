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
alter table accounts add column if not exists display_name text;
alter table accounts add column if not exists avatar_url text;
alter table accounts add column if not exists profile_updated_at timestamptz;
-- filled by "Sign in with X" on the website
alter table accounts add column if not exists banner_url text;
alter table accounts add column if not exists bio text;
alter table accounts add column if not exists followers_count int;
alter table accounts add column if not exists following_count int;
alter table accounts add column if not exists verified boolean;

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

alter table leaderboard add column if not exists earned numeric not null default 0;

-- backfill earned (total profit from winning trades) for existing rows
update leaderboard l
set earned = coalesce(w.total, 0)
from (
  select user_id, sum(back - stake) as total
  from trades
  where status = 'won'
  group by user_id
) w
where w.user_id = l.x_user_id;

create index if not exists leaderboard_pnl_idx on leaderboard (pnl desc);
create index if not exists trades_won_back_idx on trades (back desc);

-- ─── money ────────────────────────────────────────────────────────────────
-- Users keep USDG in their own deposit wallet (accounts.wallet_address).
-- A bet sends the stake straight to the house wallet; wins and refunds are paid back from it.
-- trades.status: placing -> open -> settling -> won | lost | void   (rejected if the stake transfer failed)

alter table trades add column if not exists wallet_address text;
alter table trades add column if not exists stake_tx text;
alter table trades add column if not exists payout_tx text;
-- opening fee charged on this bet: fee_rate = risk_fee_rate (house utilization tier) + crowd_fee_rate (open bets on the post)
alter table trades add column if not exists fee_rate numeric;
alter table trades add column if not exists risk_fee_rate numeric;
alter table trades add column if not exists crowd_fee_rate numeric;
create index if not exists trades_tweet_status_idx on trades (tweet_id, status);
create index if not exists trades_status_idx on trades (status, expires_at);

-- deposits into / withdrawals out of users' deposit wallets, recorded by the bot from chain logs.
-- stakes to and payouts from the house wallet are not included (they're bets, see trades).
create table if not exists wallet_events (
  tx_hash text not null,
  log_index int not null,
  kind text not null check (kind in ('deposit', 'withdrawal')),
  x_user_id text not null references accounts (x_user_id),
  amount numeric not null,
  counterparty text,
  block_number bigint not null,
  occurred_at timestamptz not null,
  primary key (tx_hash, log_index, kind)
);
create index if not exists wallet_events_user_idx on wallet_events (x_user_id, occurred_at desc);
alter table bot_state add column if not exists events_block bigint;

-- numbers behind the bot's /house endpoint
create or replace function house_stats()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'open_count',      count(*) filter (where status in ('placing', 'open', 'settling')),
    'open_staked',     coalesce(sum(stake) filter (where status in ('placing', 'open', 'settling')), 0),
    'open_max_payout', coalesce(sum(back)  filter (where status in ('placing', 'open', 'settling')), 0),
    'lost_stakes',     coalesce(sum(stake) filter (where status = 'lost'), 0),
    'winner_profit',   coalesce(sum(back - stake) filter (where status = 'won'), 0),
    -- the 5% opening fee is kept on every bet whose stake landed, whatever the outcome
    'fees',            coalesce(sum(fee) filter (where status in ('open', 'settling', 'won', 'lost', 'void')), 0),
    'fees_today',      coalesce(sum(fee) filter (where status in ('open', 'settling', 'won', 'lost', 'void')
                                                  and opened_at >= date_trunc('day', now())), 0),
    'settled_count',   count(*) filter (where status in ('won', 'lost')),
    -- house result per settled trade: fee, plus the stake on a loss, minus the winner's profit on a win
    'net_today',       coalesce(sum(house_net) filter (where settled_at >= date_trunc('day', now())), 0),
    'net_7d',          coalesce(sum(house_net) filter (where settled_at >= now() - interval '7 days'), 0),
    'net_30d',         coalesce(sum(house_net) filter (where settled_at >= now() - interval '30 days'), 0),
    'net_all',         coalesce(sum(house_net), 0)
  )
  from (
    select *,
           case status
             when 'lost' then fee + stake
             when 'won'  then fee + stake - back
             when 'void' then fee
             else 0
           end as house_net
    from trades
  ) t;
$$;

revoke all on function house_stats() from public, anon, authenticated;
grant execute on function house_stats() to service_role;

alter table accounts enable row level security;
alter table leaderboard enable row level security;
alter table creators enable row level security;
alter table bot_state enable row level security;
alter table seen_mentions enable row level security;
alter table trades enable row level security;
alter table wallet_events enable row level security;
