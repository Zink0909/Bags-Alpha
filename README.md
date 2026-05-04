# Bags Alpha — Early Signal Radar

**Live:** https://bags-alpha-pied.vercel.app  
**Built for:** The Bags Hackathon (DoraHacks, April–June 2026)  
**Telegram Bot:** @BagsAlphaBot

Bags Alpha identifies tokens on Bags.fm that are about to move — before the market prices them in. It fuses real-time social signals from X with on-chain fee data from the Bags API, runs each token through a multi-layer signal model powered by Claude NLP, and delivers alerts via Telegram.

---

## The Problem

Bags.fm has over 170,000 tokens. There is no tool to help users tell apart a genuine opportunity from coordinated hype. Most tokens on the platform get no analysis at all — users either stumble onto something by chance or arrive after the move has already happened.

---

## How It Works

Every token is scored across three dimensions:

**Attention** (30%)  
Real tweet volume for `$SYMBOL` over the past 7 days, weighted by author follower count (KOL mentions count more). Each tweet is individually scored by Claude — quality 0–10, where 0 is spam/shill and 10 is genuine community discussion. Sentiment (bullish/bearish/neutral) is tracked separately. Coordination risk is calculated by measuring time concentration, author repetition, and text similarity across up to 50 tweets. Creator post frequency is factored in as an activity signal.

**Conversion** (40%)  
Lifetime fees generated on Bags.fm, converted to a 0–100 score on a log scale. This is the most reliable signal — fees are objective, on-chain, and hard to fake.

**Momentum** (30%)  
The ratio of unclaimed fees to lifetime fees. If fees are accumulating but not being claimed, trading is accelerating. This is a leading indicator of a token entering its growth phase.

The three scores combine into a **Potential Score**. Each token is then classified:

| Tag | Condition |
|-----|-----------|
| Breakout | High attention + real trading activity |
| Stealth Gem | Low social presence + real capital accumulating |
| Fake Hype | High social noise + zero on-chain conviction |
| No Signal | Both dimensions flat |

---

## Signal Quality

What separates Bags Alpha from a simple dashboard is the quality filter on attention data.

Raw tweet counts are meaningless on their own. A token can have 50 tweets from bot farms with zero impressions, zero engagement, all posted within 5 minutes of each other, all with identical structure. That is not attention — that is manipulation. Bags Alpha detects this.

Claude evaluates each tweet individually and returns both a quality score and a sentiment classification. Coordination risk is computed separately by looking at the behavioral pattern across the full set of tweets, not just individual content. A token with high coordination risk gets a significant penalty to its attention score, which can flip its classification from Breakout to Fake Hype.

---

## Architecture

```
Bags API (feed, fees, pools, creators, claims, quote)
    |
    ├── analyzeTokens()   — latest 100 tokens from feed
    └── analyzePools()    — sweetspot tokens (0.05–5 SOL fees) from all 175k pools

X API (search/recent, user timeline)
    |
    └── getTwitterSignal()
            ├── tweet volume + engagement + impressions
            ├── KOL weighting (followers > 10k: 3x, > 100k: 5x)
            ├── Claude NLP (quality score + sentiment per tweet)
            ├── coordination detection (time, author, text similarity)
            └── creator post frequency

Supabase
    ├── token_snapshots — hourly snapshots of all token scores
    │       → powers homepage (fast reads, no timeout risk)
    │       → enables fee trend charts and historical analysis
    └── watchlist — user subscriptions (telegram_chat_id + creator_username)

Telegram Bot (@BagsAlphaBot)
    ├── /api/alert   — pushes new Breakout tokens (score ≥ 70) automatically
    ├── /api/telegram — webhook for bot commands
    └── Commands: /top /watch /list /remove /help
```

**Stack:** Next.js 16, TypeScript, Tailwind, Supabase, Vercel

---

## Watchlist

Users can follow specific creators and receive Telegram alerts when their tokens show signal. There are two ways to manage a watchlist:

**Via the web app** — go to any token's detail page, find the Creator section, and click "Watch Creator". Enter your Telegram Chat ID (get it from @userinfobot) and save.

**Via Telegram** — message @BagsAlphaBot directly:

```
/watch wolflovesmelon   — follow a creator
/list                   — see your watchlist
/remove wolflovesmelon  — unfollow
/top                    — current Breakout tokens
```

---

## Token Discovery

The feed API returns the 100 most recently launched tokens. This misses older tokens that are now entering their growth phase.

To solve this, Bags Alpha also samples from the full pool of 175,000+ tokens on the platform. It filters for tokens with lifetime fees in the 0.05–5 SOL range — the sweet spot where real trading is happening but the token hasn't already run. These tokens are enriched with metadata and scored through the same pipeline.

---

## Running Locally

```bash
git clone https://github.com/Zink0909/Bags-Alpha.git
cd Bags-Alpha
npm install
```

Create `.env.local`:

```
BAGS_API_KEY=your_bags_api_key
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
X_BEARER_TOKEN=your_x_bearer_token
ANTHROPIC_API_KEY=your_anthropic_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

API endpoints:
- `GET /api/analyze` — full token analysis with scores
- `GET /api/snapshot` — run analysis and persist to Supabase
- `GET /api/alert` — push new Breakout tokens to Telegram
- `POST /api/telegram` — Telegram bot webhook
- `GET /api/watchlist?chatId=` — get watchlist for a chat ID
- `POST /api/watchlist` — add to watchlist
- `DELETE /api/watchlist` — remove from watchlist

---

## Roadmap

**Near-term**  
Creator page (`/creator/[username]`) — all tokens from a creator with current signal status. KOL accuracy tracking — record which KOLs mentioned which tokens, measure whether conversion followed. Fee trend analysis — surface tokens where fee growth is accelerating.

**Medium-term**  
Historical probability distributions — given a token's current signal profile, show how similar patterns have played out historically. Server-Sent Events to replace 60-second polling. Bags ReStream API integration for real-time swap events.

**Long-term**  
Chrome extension — show Bags Alpha signal scores directly on Bags.fm without leaving the page. User accounts with personalized ranking based on risk preference and trading history.

---

## Why This Exists

Bags.fm earns on trading volume. Bags Alpha drives volume by helping users find opportunities earlier and filter out manipulation. Every Breakout call that converts to a trade is a direct contribution to platform revenue. Every Fake Hype warning is a user who didn't get burned and didn't leave.

The goal is to become the intelligence layer that every serious Bags.fm trader checks before entering a position — and eventually, to be integrated directly into the Bags.fm experience.
