import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { Contract, JsonRpcProvider, MaxUint256, Wallet, id as toBytes32 } from "ethers";

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
    pollMs: Number(process.env.POLL_MS || 15000),
    maxStake: Number(process.env.MAX_STAKE || 1000),
    requireAccount: process.env.REQUIRE_ACCOUNT !== "false",
    creators: (process.env.CREATORS || "nova,mira,rio")
      .split(",")
      .map((name) => name.trim().replace(/^@/, ""))
      .filter(Boolean),
    chainId: Number(process.env.CHAIN_ID || 4663),
    rpcUrl: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
    usdc: process.env.USDC_ADDRESS || "0x378F906eAD242F0C3aa9ed45AA07612A2C088030",
    usdcDecimals: Number(process.env.USDC_DECIMALS || 18),
    escrow: process.env.ESCROW_ADDRESS || "",
  };
}

function profitRate(minutes, leverage) {
  return (60 / minutes) * (leverage - 1) * 0.05;
}

function quoteTrade(stake, minutes, leverage) {
  const profit = stake * profitRate(minutes, leverage);
  const fee = stake * 0.05;
  return { back: stake + profit - fee, fee };
}

function lineAllowed(leverage, minutes) {
  if (!LINES.includes(leverage) || !CLOCKS.includes(minutes)) return false;
  if (leverage === 2 && minutes !== 5) return false;
  return true;
}

function parseCommand(text, botUsername) {
  const match = String(text || "")
    .trim()
    .match(new RegExp(`^@${botUsername}\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+)\\s*x\\s+(\\d+)\\s*m$`, "i"));
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
        "user.fields": "id,username",
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

function houseWallet() {
  return deriveWallet("house");
}

const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const ESCROW_ABI = [
  "function lock(bytes32 id, uint256 stake, uint256 payout)",
  "function settleWin(bytes32 id)",
  "function settleLoss(bytes32 id)",
  "function settleVoid(bytes32 id)",
];

function toUnits(amount) {
  const decimals = BigInt(config.usdcDecimals);
  const [whole, frac = ""] = String(amount).split(".");
  const padded = (frac + "0".repeat(Number(decimals))).slice(0, Number(decimals));
  return BigInt(whole || "0") * 10n ** decimals + BigInt(padded || "0");
}

function tradeId(mentionId) {
  return toBytes32(String(mentionId));
}

async function lockStake(wallet, mentionId, stake, payout) {
  const usdc = new Contract(config.usdc, USDC_ABI, wallet);
  const stakeUnits = toUnits(stake);
  const allowance = await usdc.allowance(wallet.address, config.escrow);
  if (allowance < stakeUnits) {
    const approveTx = await usdc.approve(config.escrow, MaxUint256);
    await approveTx.wait();
  }
  const escrow = new Contract(config.escrow, ESCROW_ABI, wallet);
  const tx = await escrow.lock(tradeId(mentionId), stakeUnits, toUnits(payout));
  await tx.wait();
}

async function settleStake(kind, mentionId) {
  const escrow = new Contract(config.escrow, ESCROW_ABI, houseWallet());
  const tx = await escrow[kind](tradeId(mentionId));
  await tx.wait();
}

async function ensureAccount(xUserId, username) {
  const wallet = userWallet(xUserId);
  const existing = unwrap(
    await db().from("accounts").select("x_user_id, username, wallet_address").eq("x_user_id", xUserId).maybeSingle(),
  );
  if (existing?.wallet_address === wallet.address) return { ...existing, wallet };
  const row = {
    x_user_id: xUserId,
    username: username || existing?.username || xUserId,
    wallet_address: wallet.address,
  };
  unwrap(await db().from("accounts").upsert(row));
  return { ...row, wallet };
}

async function recordScore(trade, status) {
  if (status === "void") return;
  const current = unwrap(
    await db().from("leaderboard").select("*").eq("x_user_id", trade.user_id).maybeSingle(),
  );
  const profit = status === "won" ? Number(trade.back) - Number(trade.stake) : -Number(trade.stake);
  unwrap(
    await db().from("leaderboard").upsert({
      x_user_id: trade.user_id,
      username: trade.username || current?.username || "",
      trades: Number(current?.trades || 0) + 1,
      wins: Number(current?.wins || 0) + (status === "won" ? 1 : 0),
      pnl: Number(current?.pnl || 0) + profit,
      biggest_win: Math.max(Number(current?.biggest_win || 0), status === "won" ? profit : 0),
      updated_at: new Date().toISOString(),
    }),
  );
}

async function leaderboard() {
  const leaders =
    unwrap(await db().from("leaderboard").select("*").order("pnl", { ascending: false }).limit(50)) || [];
  const topTrades =
    unwrap(
      await db()
        .from("trades")
        .select("username, user_id, stake, leverage, minutes, back, tweet_id, settled_at")
        .eq("status", "won")
        .order("back", { ascending: false })
        .limit(20),
    ) || [];
  return { leaders, topTrades };
}

async function handleMention({ mention, includes, x, config, creators }) {
  if (!mention?.id || !mention.text) return;
  const command = parseCommand(mention.text, config.botUsername);
  if (!command.ok) {
    if (!mention.text.toLowerCase().includes(`@${config.botUsername.toLowerCase()}`)) return;
    const text = command.reason === "two-x" ? "2x is only on a 5m clock" : `@${config.botUsername} 10 3x 15m`;
    await x.reply(text, mention.id);
    return;
  }
  if (command.stake > config.maxStake) {
    await x.reply(`max stake is ${config.maxStake}`, mention.id);
    return;
  }

  const user = (includes.users || []).find((item) => item.id === mention.author_id);
  const account = await ensureAccount(mention.author_id, user?.username || "");

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
  const quote = quoteTrade(command.stake, command.minutes, command.leverage);
  try {
    await lockStake(account.wallet, mention.id, command.stake, quote.back);
  } catch (error) {
    await x.reply(`fund ${account.wallet_address} with USDC and ETH for gas on Robinhood Chain, then reply again`, mention.id);
    console.error("pull", mention.id, error.message);
    return;
  }
  const openedAt = new Date();
  try {
    unwrap(
      await db().from("trades").insert({
        mention_id: mention.id,
        user_id: mention.author_id,
        username: user?.username || "",
        tweet_id: parent.id,
        stake: command.stake,
        leverage: command.leverage,
        minutes: command.minutes,
        entry,
        target,
        back: quote.back,
        fee: quote.fee,
        status: "open",
        opened_at: openedAt.toISOString(),
        expires_at: new Date(openedAt.getTime() + command.minutes * 60 * 1000).toISOString(),
      }),
    );
  } catch (error) {
    await settleStake("settleVoid", mention.id).catch(() => {});
    throw error;
  }
  await x.reply(
    `locked ${command.leverage}x · ${command.minutes}m · hits ${target.toLocaleString("en-US")}`,
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
    const tweet = byId.get(trade.tweet_id);
    const finalScore = tweet ? engagementScore(tweet.public_metrics) : null;
    const status = !tweet ? "void" : finalScore >= Number(trade.target) ? "won" : "lost";
    if (status === "won") await settleStake("settleWin", trade.mention_id);
    if (status === "lost") await settleStake("settleLoss", trade.mention_id);
    if (status === "void") await settleStake("settleVoid", trade.mention_id);
    unwrap(
      await db()
        .from("trades")
        .update({ status, final: finalScore, settled_at: new Date().toISOString() })
        .eq("mention_id", trade.mention_id),
    );
    await recordScore(trade, status);
    const text = !tweet
      ? "post was gone before the clock ended"
      : status === "won"
        ? `hit ${finalScore.toLocaleString("en-US")} · ${trade.leverage}x won · back ${trade.back}`
        : `ended ${finalScore.toLocaleString("en-US")} · ${trade.leverage}x missed`;
    await x.reply(text, trade.mention_id).catch(() => {});
  }
}

await loadEnv();
const config = cfg();
if (!process.env.WALLET_KEY) throw new Error("WALLET_KEY is required");
if (!process.env.ESCROW_ADDRESS) throw new Error("ESCROW_ADDRESS is required");
provider = new JsonRpcProvider(config.rpcUrl, config.chainId);
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
    if (url.pathname === "/leaderboard") {
      try {
        const body = JSON.stringify(await leaderboard());
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

console.log(`bot @${config.botUsername} watching ${creators.map((user) => user.username).join(", ")}`);
await tick();
setInterval(() => {
  tick().catch((error) => console.error(error.message));
}, config.pollMs);
