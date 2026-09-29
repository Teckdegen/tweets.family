import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  dataSlice,
  formatUnits,
  getAddress,
  id as keccakId,
  zeroPadValue,
} from "ethers";

const API = "https://api.x.com/2";
const CLOCKS = [5, 15, 30];
const LINES = [2, 3, 4, 5];

async function loadEnv() {
  try {
    const raw = await readFile(path.join(import.meta.dirname, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    /* Railway injects env vars */
  }
}

function cfg() {
  return {
    bearer: process.env.BEARER_TOKEN || "",
    botUsername: (process.env.BOT_USERNAME || "tweetscc").replace(/^@/, ""),
    botUserId: process.env.BOT_USER_ID || "",
    accessToken: process.env.BOT_ACCESS_TOKEN || "",
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    refreshToken: process.env.BOT_REFRESH_TOKEN || "",
    pollMs: Number(process.env.POLL_MS || 5000),
    maxStake: Number(process.env.MAX_STAKE || 1000),
    requireAccount: process.env.REQUIRE_ACCOUNT !== "false",
    siteUrl: process.env.SITE_URL || "tweetsfamily.vercel.app",
    creators: (process.env.CREATORS || "nova,mira,rio")
      .split(",")
      .map((name) => name.trim().replace(/^@/, ""))
      .filter(Boolean),
    chainId: Number(process.env.CHAIN_ID || 4663),
    rpcUrl: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
    // the stablecoin users bet with (USDG). the `usdc` names below are historical
    usdc: process.env.TOKEN_ADDRESS || process.env.USDC_ADDRESS || "",
    usdcDecimals: Number(process.env.TOKEN_DECIMALS || process.env.USDC_DECIMALS || 6),
    tokenSymbol: process.env.TOKEN_SYMBOL || "USDG",
    houseKey: process.env.HOUSE_PRIVATE_KEY || "",
    // first block to scan for deposits/withdrawals on the very first run (default: current block)
    eventsStartBlock: process.env.EVENTS_START_BLOCK ? Number(process.env.EVENTS_START_BLOCK) : null,
    logChunk: Number(process.env.LOG_CHUNK || 2000),
  };
}

function profitRate(minutes, leverage) {
  return (60 / minutes) * (leverage - 1) * 0.05;
}

// Opening fee = house-risk fee + crowd fee.
// House risk: utilization = what the house would owe if every open bet won ÷ house wallet balance.
const FEE_TIERS = [
  { below: 0.3, rate: 0.05 },
  { below: 0.6, rate: 0.1 },
  { below: Infinity, rate: 0.2 },
];
// Crowd: every bet already open on the same post adds 2%, up to +10%. Max total fee: 30%.
const CROWD_STEP = 0.02;
const CROWD_MAX = 0.1;

function utilization(house) {
  return house.balance > 0 ? house.active_bets.max_payout / house.balance : 1;
}

function riskFeeRate(util) {
  return FEE_TIERS.find((tier) => util < tier.below).rate;
}

function crowdFeeRate(openOnPost) {
  return Math.min(openOnPost * CROWD_STEP, CROWD_MAX);
}

// The fee is taken when the bet opens; the bet itself is the rest.
// `amount` is what leaves the wallet, `stake` is what's recorded and paid on.
function quoteTrade(amount, minutes, leverage, feeRate) {
  const fee = round2(amount * feeRate);
  const stake = round2(amount - fee);
  const back = round2(stake + stake * profitRate(minutes, leverage));
  return { amount, fee, stake, back };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function pct(rate) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function lineAllowed(leverage, minutes) {
  if (!LINES.includes(leverage) || !CLOCKS.includes(minutes)) return false;
  if (leverage === 2 && minutes !== 5) return false;
  return true;
}

function parseCommand(text, botUsername) {
  const match = String(text || "")
    .trim()
    // replies start with the handles being replied to, e.g. "@nova @tweetscc 10 3x 15m"
    .match(new RegExp(`(?:^|\\s)@${botUsername}\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+)\\s*x\\s+(\\d+)\\s*m\\b`, "i"));
  if (!match) return { ok: false, reason: "format" };
  const stake = Number(match[1]);
  const leverage = Number(match[2]);
  const minutes = Number(match[3]);
  if (!Number.isFinite(stake) || stake <= 0) return { ok: false, reason: "stake" };
  if (!lineAllowed(leverage, minutes)) {
    return { ok: false, reason: leverage === 2 ? "two-x" : "line" };
  }
  return { ok: true, stake, leverage, minutes };
}

function engagementScore(metrics = {}) {
  return (
    (Number(metrics.like_count) || 0) +
    (Number(metrics.retweet_count) || 0) +
    (Number(metrics.reply_count) || 0) +
    (Number(metrics.quote_count) || 0)
  );
}

let supabase;
let provider;
function db() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

function unwrap(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function createX(config) {
  let access = config.accessToken;
  let refresh = config.refreshToken;

  async function persistTokens() {
    unwrap(
      await db().from("bot_state").upsert({
        id: 1,
        access_token: access,
        refresh_token: refresh,
      }),
    );
  }

  async function savedToken() {
    const row = unwrap(await db().from("bot_state").select("access_token, refresh_token").eq("id", 1).maybeSingle());
    if (row?.access_token) access = row.access_token;
    if (row?.refresh_token) refresh = row.refresh_token;
  }

  async function refreshAccess() {
    if (!refresh || !config.clientId || !config.clientSecret) return;
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh });
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const response = await fetch(`${API}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) return;
    const json = await response.json();
    if (json.access_token) access = json.access_token;
    if (json.refresh_token) refresh = json.refresh_token;
    await persistTokens();
  }

  async function request(url, { user = false, method = "GET", body } = {}) {
    const send = async (token) =>
      fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

    const token = user ? access : config.bearer || access;
    let response = await send(token);
    let json = await response.json().catch(() => ({}));
    if (response.status === 401 && user) {
      await refreshAccess();
      response = await send(access);
      json = await response.json().catch(() => ({}));
    }
    if (!response.ok) throw new Error(json.title || json.detail || `X ${response.status}`);
    return json;
  }

  return {
    savedToken,
    async userId() {
      if (config.botUserId) return config.botUserId;
      const json = await request(`${API}/users/by/username/${config.botUsername}`);
      return json.data.id;
    },
    async mentions(userId, sinceId) {
      const query = new URLSearchParams({
        max_results: "100",
        "tweet.fields": "created_at,author_id,conversation_id,referenced_tweets,text,public_metrics",
        expansions: "referenced_tweets.id,author_id,referenced_tweets.id.author_id",
        "user.fields": "id,username,name,profile_image_url",
      });
      if (sinceId) query.set("since_id", sinceId);
      return request(`${API}/users/${userId}/mentions?${query}`, { user: true });
    },
    async tweets(ids) {
      const list = [...new Set(ids.filter(Boolean))].slice(0, 100);
      if (!list.length) return { data: [] };
      const query = new URLSearchParams({
        ids: list.join(","),
        "tweet.fields": "public_metrics,author_id,created_at",
        expansions: "author_id",
        "user.fields": "id,username",
      });
      return request(`${API}/tweets?${query}`);
    },
    async usersByUsernames(names) {
      const query = new URLSearchParams({
        usernames: names.join(","),
        "user.fields": "id,username",
      });
      return request(`${API}/users/by?${query}`);
    },
    // full profile for the website: name, bio, avatar, banner, follower counts, verified.
    // profile_banner_url isn't available on every API tier, so retry without it if X rejects it
    async usersByIds(ids) {
      const list = [...new Set(ids.filter(Boolean))].slice(0, 100);
      if (!list.length) return { data: [] };
      const base = "id,username,name,description,profile_image_url,public_metrics,verified";
      const lookup = (fields) =>
        request(`${API}/users?${new URLSearchParams({ ids: list.join(","), "user.fields": fields })}`);
      try {
        return await lookup(`${base},profile_banner_url`);
      } catch {
        return lookup(base);
      }
    },
    reply(text, replyToId) {
      return request(`${API}/tweets`, {
        user: true,
        method: "POST",
        body: { text, reply: { in_reply_to_tweet_id: replyToId } },
      });
    },
  };
}

async function ensureCreators(x, handles) {
  const cached = unwrap(await db().from("creators").select("x_user_id, username")) || [];
  const wanted = new Set(handles.map((name) => name.toLowerCase()));
  const same =
    cached.length === handles.length &&
    cached.every((user) => wanted.has(user.username.toLowerCase()));
  if (same) return cached.map((user) => ({ id: user.x_user_id, username: user.username }));

  const json = await x.usersByUsernames(handles);
  const users = (json.data || []).map((user) => ({ id: user.id, username: user.username }));
  unwrap(await db().from("creators").delete().not("x_user_id", "is", null));
  if (users.length) {
    unwrap(
      await db()
        .from("creators")
        .insert(users.map((user) => ({ x_user_id: user.id, username: user.username }))),
    );
  }
  return users;
}

function parentTweet(mention, includes) {
  const ref = (mention.referenced_tweets || []).find((item) => item.type === "replied_to");
  if (!ref) return null;
  return (includes.tweets || []).find((tweet) => tweet.id === ref.id) || { id: ref.id };
}

function deriveWallet(label) {
  const key = createHmac("sha256", process.env.WALLET_KEY).update(label).digest("hex");
  return new Wallet(`0x${key}`, provider);
}

function userWallet(xUserId) {
  return deriveWallet(`x:${xUserId}`);
}

let house;
function houseWallet() {
  if (!house) {
    house = config.houseKey
      ? new Wallet(config.houseKey.startsWith("0x") ? config.houseKey : `0x${config.houseKey}`, provider)
      : deriveWallet("house");
  }
  return house;
}

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

function toUnits(amount) {
  const decimals = BigInt(config.usdcDecimals);
  const [whole, frac = ""] = String(amount).split(".");
  const padded = (frac + "0".repeat(Number(decimals))).slice(0, Number(decimals));
  return BigInt(whole || "0") * 10n ** decimals + BigInt(padded || "0");
}

function usdcOf(runner) {
  return new Contract(config.usdc, USDC_ABI, runner);
}

async function usdcBalance(address) {
  return Number(formatUnits(await usdcOf(provider).balanceOf(address), config.usdcDecimals));
}

// Sends the token from a user's wallet. The house tops the wallet up with ETH first so
// users only ever need to hold the token.
async function sendFromUser(wallet, to, units) {
  const usdc = usdcOf(wallet);
  const data = usdc.interface.encodeFunctionData("transfer", [to, units]);
  const gas = await provider.estimateGas({ from: wallet.address, to: config.usdc, data });
  const fees = await provider.getFeeData();
  const price = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
  const need = gas * price * 2n;
  const eth = await provider.getBalance(wallet.address);
  if (eth < need) {
    const topUp = await houseWallet().sendTransaction({ to: wallet.address, value: need - eth });
    await topUp.wait();
  }
  const tx = await usdc.transfer(to, units, { gasLimit: (gas * 12n) / 10n });
  await tx.wait();
  return tx.hash;
}

async function openBetsOnPost(tweetId) {
  const { count, error } = await db()
    .from("trades")
    .select("mention_id", { count: "exact", head: true })
    .eq("tweet_id", tweetId)
    .in("status", ["placing", "open", "settling"]);
  if (error) throw new Error(error.message);
  return count || 0;
}

const TRANSFER_TOPIC = keccakId("Transfer(address,address,uint256)");
const blockTimes = new Map();

async function blockTime(number) {
  if (!blockTimes.has(number)) {
    if (blockTimes.size > 500) blockTimes.clear();
    const block = await provider.getBlock(number);
    blockTimes.set(number, new Date(Number(block.timestamp) * 1000).toISOString());
  }
  return blockTimes.get(number);
}

// Records token transfers into (deposits) and out of (withdrawals) users' deposit wallets for their
// history. Transfers to/from the house wallet are skipped: those are stakes and payouts.
async function trackWalletEvents() {
  const safe = (await provider.getBlockNumber()) - 2;
  const state = unwrap(await db().from("bot_state").select("events_block").eq("id", 1).maybeSingle());
  let from = state?.events_block != null ? Number(state.events_block) : (config.eventsStartBlock ?? safe);
  if (from > safe) return;

  const accounts =
    unwrap(await db().from("accounts").select("x_user_id, wallet_address").not("wallet_address", "is", null)) || [];
  const owners = new Map(accounts.map((row) => [row.wallet_address.toLowerCase(), row.x_user_id]));
  const topics = [...owners.keys()].map((address) => zeroPadValue(address, 32));
  const house = houseWallet().address.toLowerCase();
  const addressOf = (topic) => getAddress(dataSlice(topic, 12)).toLowerCase();

  while (from <= safe) {
    const to = Math.min(from + config.logChunk - 1, safe);
    for (let i = 0; i < topics.length; i += 100) {
      const batch = topics.slice(i, i + 100);
      const range = { address: config.usdc, fromBlock: from, toBlock: to };
      const [incoming, outgoing] = await Promise.all([
        provider.getLogs({ ...range, topics: [TRANSFER_TOPIC, null, batch] }),
        provider.getLogs({ ...range, topics: [TRANSFER_TOPIC, batch] }),
      ]);
      const rows = [];
      for (const [kind, logs] of [
        ["deposit", incoming],
        ["withdrawal", outgoing],
      ]) {
        for (const log of logs) {
          const sender = addressOf(log.topics[1]);
          const receiver = addressOf(log.topics[2]);
          const mine = kind === "deposit" ? receiver : sender;
          const other = kind === "deposit" ? sender : receiver;
          const xUserId = owners.get(mine);
          if (!xUserId || other === house) continue;
          rows.push({
            tx_hash: log.transactionHash,
            log_index: log.index,
            kind,
            x_user_id: xUserId,
            amount: formatUnits(BigInt(log.data), config.usdcDecimals),
            counterparty: other,
            block_number: log.blockNumber,
            occurred_at: await blockTime(log.blockNumber),
          });
        }
      }
      if (rows.length) {
        unwrap(
          await db()
            .from("wallet_events")
            .upsert(rows, { onConflict: "tx_hash,log_index,kind", ignoreDuplicates: true }),
        );
      }
    }
    unwrap(await db().from("bot_state").upsert({ id: 1, events_block: to + 1 }));
    from = to + 1;
  }
}

// accounts made on the website get their deposit address here
async function assignDepositAddresses() {
  const missing = unwrap(await db().from("accounts").select("x_user_id").is("wallet_address", null)) || [];
  for (const row of missing) {
    unwrap(
      await db()
        .from("accounts")
        .update({ wallet_address: userWallet(row.x_user_id).address })
        .eq("x_user_id", row.x_user_id),
    );
  }
}

async function houseStats() {
  const stats = unwrap(await db().rpc("house_stats")) || {};
  const balance = await usdcBalance(houseWallet().address);
  const maxPayout = Number(stats.open_max_payout) || 0;
  return {
    house_wallet: houseWallet().address,
    balance,
    active_bets: {
      count: Number(stats.open_count) || 0,
      staked: Number(stats.open_staked) || 0,
      max_payout: maxPayout,
    },
    revenue: {
      today: Number(stats.net_today) || 0,
      last_7d: Number(stats.net_7d) || 0,
      last_30d: Number(stats.net_30d) || 0,
      all_time: Number(stats.net_all) || 0,
      lost_stakes: Number(stats.lost_stakes) || 0,
      paid_to_winners: Number(stats.winner_profit) || 0,
      fees: Number(stats.fees) || 0,
      fees_today: Number(stats.fees_today) || 0,
      settled_bets: Number(stats.settled_count) || 0,
    },
    free: balance - maxPayout,
    fee: {
      utilization: balance > 0 ? maxPayout / balance : 1,
      risk_fee_rate: riskFeeRate(balance > 0 ? maxPayout / balance : 1),
      crowd_fee_step: CROWD_STEP,
      crowd_fee_max: CROWD_MAX,
    },
    updated_at: new Date().toISOString(),
  };
}

async function hasAccount(xUserId) {
  const row = unwrap(await db().from("accounts").select("x_user_id").eq("x_user_id", xUserId).maybeSingle());
  return Boolean(row);
}

const PROFILE_TTL = 24 * 60 * 60 * 1000;

function avatarUrl(url) {
  return url ? url.replace("_normal.", "_400x400.") : null;
}

// Only fields X actually returned are written, so a lookup that didn't ask for the bio or banner
// (e.g. a mention's author) never blanks what sign-in or the daily refresh saved.
function profileFields(user) {
  const fields = {
    display_name: user.name || null,
    avatar_url: avatarUrl(user.profile_image_url),
    profile_updated_at: new Date().toISOString(),
  };
  if (user.description !== undefined) fields.bio = user.description || null;
  if (user.profile_banner_url !== undefined) fields.banner_url = user.profile_banner_url || null;
  if (user.verified !== undefined) fields.verified = Boolean(user.verified);
  if (user.public_metrics) {
    fields.followers_count = user.public_metrics.followers_count ?? null;
    fields.following_count = user.public_metrics.following_count ?? null;
  }
  return fields;
}

async function ensureAccount(xUserId, user) {
  const wallet = userWallet(xUserId);
  const existing = unwrap(
    await db()
      .from("accounts")
      .select("x_user_id, username, wallet_address, display_name, avatar_url")
      .eq("x_user_id", xUserId)
      .maybeSingle(),
  );
  const sameProfile =
    !user ||
    (existing?.username === user.username &&
      existing?.display_name === (user.name || null) &&
      existing?.avatar_url === avatarUrl(user.profile_image_url));
  if (existing?.wallet_address === wallet.address && sameProfile) return { ...existing, wallet };
  const row = {
    x_user_id: xUserId,
    username: user?.username || existing?.username || xUserId,
    wallet_address: wallet.address,
    ...(user ? profileFields(user) : {}),
  };
  unwrap(await db().from("accounts").upsert(row));
  return { ...row, wallet };
}

async function refreshProfiles(accounts) {
  const stale = accounts.filter(
    (row) =>
      !row.avatar_url ||
      !row.profile_updated_at ||
      Date.now() - new Date(row.profile_updated_at).getTime() > PROFILE_TTL,
  );
  if (!stale.length) return;
  try {
    const json = await x.usersByIds(stale.map((row) => row.x_user_id));
    for (const user of json.data || []) {
      const fields = { username: user.username, ...profileFields(user) };
      unwrap(await db().from("accounts").update(fields).eq("x_user_id", user.id));
      Object.assign(accounts.find((row) => row.x_user_id === user.id) || {}, fields);
    }
  } catch (error) {
    console.error("profiles", error.message);
  }
}

async function recordScore(trade, status) {
  const current = unwrap(
    await db().from("leaderboard").select("*").eq("x_user_id", trade.user_id).maybeSingle(),
  );
  // PNL is against what left the wallet: stake + opening fee. A void only costs the fee.
  const paid = Number(trade.stake) + Number(trade.fee);
  const profit =
    status === "won" ? Number(trade.back) - paid : status === "void" ? -Number(trade.fee) : -paid;
  const counted = status === "void" ? 0 : 1;
  unwrap(
    await db().from("leaderboard").upsert({
      x_user_id: trade.user_id,
      username: trade.username || current?.username || "",
      trades: Number(current?.trades || 0) + counted,
      wins: Number(current?.wins || 0) + (status === "won" ? 1 : 0),
      pnl: Number(current?.pnl || 0) + profit,
      earned: Number(current?.earned || 0) + (status === "won" ? profit : 0),
      biggest_win: Math.max(Number(current?.biggest_win || 0), status === "won" ? profit : 0),
      updated_at: new Date().toISOString(),
    }),
  );
}

let boardCache = { at: 0, body: null };

async function leaderboard() {
  if (boardCache.body && Date.now() - boardCache.at < 15000) return boardCache.body;
  const rows =
    unwrap(await db().from("leaderboard").select("*").order("pnl", { ascending: false }).limit(50)) || [];
  const accounts = rows.length
    ? unwrap(
        await db()
          .from("accounts")
          .select("x_user_id, username, wallet_address, display_name, avatar_url, profile_updated_at")
          .in(
            "x_user_id",
            rows.map((row) => row.x_user_id),
          ),
      ) || []
    : [];
  await refreshProfiles(accounts);
  const byUser = new Map(accounts.map((row) => [row.x_user_id, row]));
  const leaders = await Promise.all(
    rows.map(async (row, index) => {
      const account = byUser.get(row.x_user_id);
      const wallet = account?.wallet_address || null;
      const trades = Number(row.trades) || 0;
      const wins = Number(row.wins) || 0;
      const username = account?.username || row.username;
      return {
        rank: index + 1,
        x_user_id: row.x_user_id,
        username,
        display_name: account?.display_name || username,
        avatar_url: account?.avatar_url || null,
        profile_url: username ? `https://x.com/${username}` : null,
        wallet_address: wallet,
        balance: wallet ? await usdcBalance(wallet).catch(() => null) : null,
        pnl: Number(row.pnl) || 0,
        earned: Number(row.earned) || 0,
        biggest_win: Number(row.biggest_win) || 0,
        trades,
        wins,
        losses: trades - wins,
        win_rate: trades ? wins / trades : 0,
        updated_at: row.updated_at,
      };
    }),
  );
  const topTrades =
    unwrap(
      await db()
        .from("trades")
        .select("username, user_id, stake, leverage, minutes, back, tweet_id, settled_at")
        .eq("status", "won")
        .order("back", { ascending: false })
        .limit(20),
    ) || [];
  const body = { leaders, topTrades };
  boardCache = { at: Date.now(), body };
  return body;
}

async function handleMention({ mention, includes, x, config, creators }) {
  if (!mention?.id || !mention.text) return;
  if (mention.author_id === config.botUserId) return;
  const command = parseCommand(mention.text, config.botUsername);
  if (!command.ok) {
    if (!mention.text.toLowerCase().includes(`@${config.botUsername.toLowerCase()}`)) return;
    const text =
      command.reason === "two-x"
        ? "2x is only on a 5m clock"
        : "tag me with stake, multiplier and clock, like: 10 3x 15m";
    await x.reply(text, mention.id);
    return;
  }
  if (command.stake > config.maxStake) {
    await x.reply(`max stake is ${config.maxStake}`, mention.id);
    return;
  }

  const user = (includes.users || []).find((item) => item.id === mention.author_id);
  if (config.requireAccount && !(await hasAccount(mention.author_id))) {
    await x.reply(
      `you don't have an account yet. head to ${config.siteUrl}, connect your X, create an account, then fund your wallet to start betting on tweets`,
      mention.id,
    );
    return;
  }
  const account = await ensureAccount(mention.author_id, user);

  let parent = parentTweet(mention, includes);
  if (!parent) {
    await x.reply("reply under a post", mention.id);
    return;
  }
  if (!parent.author_id || !parent.public_metrics) {
    const looked = await x.tweets([parent.id]);
    parent = looked.data?.[0] || parent;
  }
  if (!parent.author_id || parent.author_id === config.botUserId) return;
  if (!creators.some((creator) => creator.id === parent.author_id)) {
    await x.reply("that creator is not on the board", mention.id);
    return;
  }

  const entry = engagementScore(parent.public_metrics);
  const target = entry * command.leverage;
  if ((await usdcBalance(account.wallet_address)) < command.stake) {
    await x.reply(
      `balance too low. deposit ${config.tokenSymbol} on Robinhood Chain to ${account.wallet_address}, then reply again`,
      mention.id,
    );
    return;
  }

  const house = await houseStats();
  const openOnPost = await openBetsOnPost(parent.id);
  const riskFee = riskFeeRate(utilization(house));
  const crowdFee = crowdFeeRate(openOnPost);
  const quote = quoteTrade(command.stake, command.minutes, command.leverage, riskFee + crowdFee);

  // at high fees some long, low-multiplier bets would pay less than was sent even on a win
  if (quote.back <= command.stake) {
    await x.reply(
      `the fee is ${pct(riskFee + crowdFee)} right now, so a win here would pay less than you put in. try a shorter clock or a higher multiplier`,
      mention.id,
    );
    return;
  }
  // the house must be able to cover every open bet winning, this one included
  if (house.balance + command.stake < house.active_bets.max_payout + quote.back) {
    await x.reply("the house is at its limit right now, try a smaller stake", mention.id);
    return;
  }

  // claim the mention first (mention_id is the primary key) so it can never be charged twice
  const openedAt = new Date();
  const claimed = await db().from("trades").insert({
    mention_id: mention.id,
    user_id: mention.author_id,
    username: user?.username || "",
    wallet_address: account.wallet_address,
    tweet_id: parent.id,
    stake: quote.stake,
    leverage: command.leverage,
    minutes: command.minutes,
    entry,
    target,
    back: quote.back,
    fee: quote.fee,
    fee_rate: riskFee + crowdFee,
    risk_fee_rate: riskFee,
    crowd_fee_rate: crowdFee,
    status: "placing",
    opened_at: openedAt.toISOString(),
    expires_at: new Date(openedAt.getTime() + command.minutes * 60 * 1000).toISOString(),
  });
  if (claimed.error) return;

  let stakeTx;
  try {
    stakeTx = await sendFromUser(account.wallet, houseWallet().address, toUnits(command.stake));
  } catch (error) {
    unwrap(await db().from("trades").update({ status: "rejected" }).eq("mention_id", mention.id));
    console.error("stake", mention.id, error.message);
    await x.reply("couldn't take the stake from your wallet, try again in a minute", mention.id);
    return;
  }
  unwrap(
    await db()
      .from("trades")
      .update({
        status: "open",
        stake_tx: stakeTx,
        // the clock starts once the stake has landed
        opened_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + command.minutes * 60 * 1000).toISOString(),
      })
      .eq("mention_id", mention.id),
  );
  await x.reply(
    `locked ${quote.stake} (after ${quote.fee} fee, ${pct(riskFee + crowdFee)}) · ${command.leverage}x · ${command.minutes}m · hits ${target.toLocaleString("en-US")} · pays ${quote.back}`,
    mention.id,
  );
}

async function settleOpen(x) {
  const due =
    unwrap(
      await db().from("trades").select("*").eq("status", "open").lte("expires_at", new Date().toISOString()),
    ) || [];
  if (!due.length) return;
  const looked = await x.tweets(due.map((trade) => trade.tweet_id));
  const byId = new Map((looked.data || []).map((tweet) => [tweet.id, tweet]));

  for (const trade of due) {
    try {
      await settleTrade(x, trade, byId.get(trade.tweet_id));
    } catch (error) {
      console.error("settle", trade.mention_id, error.message);
    }
  }
}

async function settleTrade(x, trade, tweet) {
  const finalScore = tweet ? engagementScore(tweet.public_metrics) : null;
  const status = !tweet ? "void" : finalScore >= Number(trade.target) ? "won" : "lost";
  const payout = status === "won" ? trade.back : status === "void" ? trade.stake : 0;

  // claim the trade so a retry or overlapping run can never pay it twice
  const claimed = unwrap(
    await db()
      .from("trades")
      .update({ status: "settling" })
      .eq("mention_id", trade.mention_id)
      .eq("status", "open")
      .select("mention_id"),
  );
  if (!claimed?.length) return;

  let payoutTx = null;
  if (payout > 0) {
    const to = trade.wallet_address || userWallet(trade.user_id).address;
    let tx;
    try {
      tx = await usdcOf(houseWallet()).transfer(to, toUnits(payout));
    } catch (error) {
      // nothing was sent, put it back so the next tick retries
      unwrap(await db().from("trades").update({ status: "open" }).eq("mention_id", trade.mention_id));
      throw error;
    }
    payoutTx = tx.hash;
    unwrap(await db().from("trades").update({ payout_tx: payoutTx }).eq("mention_id", trade.mention_id));
    // if this throws the trade stays "settling" with its payout_tx for a manual check
    await tx.wait();
  }

  unwrap(
    await db()
      .from("trades")
      .update({ status, final: finalScore, settled_at: new Date().toISOString() })
      .eq("mention_id", trade.mention_id),
  );
  await recordScore(trade, status);
  const text = !tweet
    ? "post was gone before the clock ended, stake refunded"
    : status === "won"
      ? `hit ${finalScore.toLocaleString("en-US")} · ${trade.leverage}x won · ${trade.back} sent to your wallet`
      : `ended ${finalScore.toLocaleString("en-US")} · ${trade.leverage}x missed`;
  await x.reply(text, trade.mention_id).catch(() => {});
}

await loadEnv();
const config = cfg();
if (!process.env.WALLET_KEY) throw new Error("WALLET_KEY is required");
if (!config.usdc) throw new Error(`TOKEN_ADDRESS (the ${config.tokenSymbol} contract) is required`);
provider = new JsonRpcProvider(config.rpcUrl, config.chainId);
try {
  config.usdcDecimals = Number(await new Contract(config.usdc, USDC_ABI, provider).decimals());
} catch (error) {
  console.error(`could not read ${config.tokenSymbol} decimals, using`, config.usdcDecimals, error.message);
}
console.log(`house wallet ${houseWallet().address} (keep ETH here for gas)`);
const x = createX(config);
await x.savedToken();
const creators = await ensureCreators(x, config.creators);
config.botUserId = config.botUserId || (await x.userId());

async function tick() {
  const state = unwrap(await db().from("bot_state").select("since_id").eq("id", 1).maybeSingle());
  const page = await x.mentions(config.botUserId, state?.since_id || null);
  const mentions = [...(page.data || [])].reverse();
  const includes = page.includes || {};

  for (const mention of mentions) {
    const seen = unwrap(
      await db().from("seen_mentions").select("mention_id").eq("mention_id", mention.id).maybeSingle(),
    );
    if (seen) continue;
    try {
      await handleMention({ mention, includes, x, config, creators });
    } catch (error) {
      console.error("mention", mention.id, error.message);
    }
    unwrap(await db().from("seen_mentions").upsert({ mention_id: mention.id }, { onConflict: "mention_id" }));
    unwrap(await db().from("bot_state").upsert({ id: 1, since_id: mention.id }));
  }

  await settleOpen(x);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://bot.local");
    const routes = { "/leaderboard": leaderboard, "/house": houseStats };
    const route = routes[url.pathname];
    if (route) {
      try {
        const body = JSON.stringify(await route());
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(body);
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
  })
  .listen(Number(process.env.PORT || 8080));

// runs fn, waits ms, repeats; never overlaps itself
function every(name, ms, fn) {
  const run = async () => {
    try {
      await fn();
    } catch (error) {
      console.error(name, error.message);
    }
    setTimeout(run, ms);
  };
  run();
}

console.log(`bot @${config.botUsername} watching ${creators.map((user) => user.username).join(", ")}`);
every("mentions", config.pollMs, tick);
every("deposit-addresses", 15000, assignDepositAddresses);
every("wallet-events", 15000, trackWalletEvents);
