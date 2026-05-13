const BEARER = process.env.X_BEARER_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

export interface TweetAnalysis {
  quality: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TwitterSignal {
  tweetCount: number;
  totalEngagement: number;
  totalImpressions: number;
  attentionScore: number;
  qualityScore: number;
  sentimentScore: number;
  creatorPostFrequency: number;
  coordinationRisk: number; // 0-100, higher = more coordinated/suspicious
}

const TWEET_ANALYSIS_SYSTEM = `You analyze crypto token tweets for signal quality and sentiment.
Reply ONLY with a valid JSON array — no markdown, no explanation, no extra text.
Each element: {"quality": <0-10>, "sentiment": "<positive|negative|neutral>"}
- quality 0: spam, bot, shill, copy-paste, zero insight
- quality 10: genuine community discussion, original analysis, real insight
- positive: bullish or supportive of the token
- negative: bearish, warning, or dump signal
- neutral: informational or no clear stance
The array must have exactly the same number of elements as the input tweets.`;

async function analyzeTweetsWithClaude(tweets: string[]): Promise<TweetAnalysis[]> {
  if (!ANTHROPIC_KEY || tweets.length === 0) {
    return tweets.map(() => ({ quality: 5, sentiment: 'neutral' as const }));
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: TWEET_ANALYSIS_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: JSON.stringify(tweets),
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(clean);
    if (Array.isArray(results) && results.length === tweets.length) {
      return results.map((r: any) => ({
        quality: Math.min(Math.max(Number(r.quality) || 5, 0), 10),
        sentiment: ['positive', 'negative', 'neutral'].includes(r.sentiment) ? r.sentiment : 'neutral',
      }));
    }
    return tweets.map(() => ({ quality: 5, sentiment: 'neutral' as const }));
  } catch {
    return tweets.map(() => ({ quality: 5, sentiment: 'neutral' as const }));
  }
}

async function getCreatorPostFrequency(username: string): Promise<number> {
  if (!BEARER || !username) return 0;
  try {
    const userRes = await fetch(
      'https://api.twitter.com/2/users/by/username/' + username + '?user.fields=public_metrics',
      { headers: { 'Authorization': 'Bearer ' + BEARER }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(10_000) }
    );
    const userData = await userRes.json();
    if (!userData.data?.id) return 0;
    const userId = userData.data.id;
    const tweetsRes = await fetch(
      'https://api.twitter.com/2/users/' + userId + '/tweets?max_results=10&tweet.fields=created_at',
      { headers: { 'Authorization': 'Bearer ' + BEARER }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(10_000) }
    );
    const tweetsData = await tweetsRes.json();
    if (!tweetsData.data || tweetsData.data.length < 2) return 0;
    const times = tweetsData.data.map((t: any) => new Date(t.created_at).getTime());
    const newest = Math.max(...times);
    const oldest = Math.min(...times);
    const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);
    if (daySpan === 0) return 7;
    return Math.round((tweetsData.data.length / daySpan) * 7 * 10) / 10;
  } catch {
    return 0;
  }
}

function detectCoordination(tweets: any[]): number {
  if (tweets.length < 5) return 0;

  // 1. Time concentration
  const times = tweets.map(t => new Date(t.created_at || 0).getTime());
  let maxInWindow = 0;
  for (const t of times) {
    const inWindow = times.filter(t2 => Math.abs(t2 - t) < 30 * 60 * 1000).length;
    maxInWindow = Math.max(maxInWindow, inWindow);
  }
  const timeConcentration = maxInWindow / tweets.length;

  // 2. Author repetition
  const authors = tweets.map(t => t.author_id);
  const uniqueAuthors = new Set(authors).size;
  const authorRepetition = 1 - (uniqueAuthors / tweets.length);

  // 3. Text similarity
  const texts = tweets.map(t => t.text.toLowerCase().slice(0, 100));
  let duplicatePairs = 0;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const shared = texts[i].split(' ').filter((w: string) => texts[j].includes(w)).length;
      const similarity = shared / Math.max(texts[i].split(' ').length, 1);
      if (similarity > 0.7) duplicatePairs++;
    }
  }
  const textSimilarity = Math.min(duplicatePairs / tweets.length, 1);

  const raw = timeConcentration * 0.4 + authorRepetition * 0.3 + textSimilarity * 0.3;
  return Math.round(raw * 100);
}

export async function getTwitterSignal(
  symbol: string,
  creatorUsername?: string
): Promise<TwitterSignal> {
  if (!BEARER) return defaultSignal();

  try {
    const query = encodeURIComponent('$' + symbol + ' -is:retweet');
    const url = 'https://api.twitter.com/2/tweets/search/recent?query=' + query
      + '&max_results=50&tweet.fields=public_metrics,author_id,created_at'
      + '&expansions=author_id&user.fields=public_metrics';

    const [tweetRes, creatorFreq] = await Promise.all([
      fetch(url, { headers: { 'Authorization': 'Bearer ' + BEARER }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(10_000) }),
      creatorUsername ? getCreatorPostFrequency(creatorUsername) : Promise.resolve(0),
    ]);

    const data = await tweetRes.json();
    if (!data.data || !Array.isArray(data.data)) return defaultSignal();

    const tweets = data.data;
    const users = data.includes?.users || [];
    const userMap: Record<string, number> = {};
    for (const u of users) {
      userMap[u.id] = u.public_metrics?.followers_count || 0;
    }

    const tweetCount = tweets.length;
    let totalEngagement = 0;
    let totalImpressions = 0;
    let botCount = 0;

    for (const tweet of tweets) {
      const m = tweet.public_metrics;
      const eng = m.like_count + m.retweet_count + m.reply_count + m.quote_count;
      const imp = m.impression_count;
      totalEngagement += eng;
      totalImpressions += imp;
      if (eng === 0 && imp === 0) botCount++;
      if (eng > 0 && imp === 0) botCount++;
    }

    const botRatio = tweetCount > 0 ? botCount / tweetCount : 0;
    const coordinationRisk = detectCoordination(tweets);

    const tweetTexts = tweets.map((t: any) => t.text.slice(0, 200));
    const analyses = await analyzeTweetsWithClaude(tweetTexts);

    const qualityScores = analyses.map(a => a.quality);
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const qualityScore = Math.round(avgQuality * 10);

    const sentimentValues: number[] = analyses.map(a =>
      a.sentiment === 'positive' ? 1 : a.sentiment === 'negative' ? -1 : 0
    );
    const avgSentiment = sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length;
    const sentimentScore = Math.round(avgSentiment * 100);

    let weightedEngagement = 0;
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      const m = tweet.public_metrics;
      const eng = m.like_count + m.retweet_count + m.reply_count + m.quote_count;
      const followers = userMap[tweet.author_id] || 0;
      const kolWeight = followers > 100000 ? 5 : followers > 10000 ? 3 : 1;
      const qualityWeight = qualityScores[i] / 10;
      weightedEngagement += eng * kolWeight * qualityWeight;
    }

    const attentionScore = computeAttentionScore(
      tweetCount, weightedEngagement, totalImpressions,
      botRatio, qualityScore, sentimentScore, creatorFreq, coordinationRisk
    );

    return {
      tweetCount, totalEngagement, totalImpressions,
      attentionScore, qualityScore, sentimentScore,
      creatorPostFrequency: creatorFreq,
      coordinationRisk,
    };
  } catch {
    return defaultSignal();
  }
}

function defaultSignal(): TwitterSignal {
  return {
    tweetCount: 0, totalEngagement: 0, totalImpressions: 0,
    attentionScore: 5, qualityScore: 0, sentimentScore: 0,
    creatorPostFrequency: 0, coordinationRisk: 0,
  };
}

function computeAttentionScore(
  count: number,
  weightedEngagement: number,
  impressions: number,
  botRatio: number,
  qualityScore: number,
  sentimentScore: number,
  creatorFrequency: number,
  coordinationRisk: number
): number {
  if (count === 0) return 5;

  let score = 15;
  score += Math.min(count * 1.5, 15);
  score += Math.min(weightedEngagement * 2, 30);

  const avgImpression = impressions / count;
  if (avgImpression > 1000) score += 12;
  else if (avgImpression > 100) score += 6;
  else if (avgImpression > 10) score += 3;

  score += Math.round((qualityScore / 100) * 15);
  score += Math.round((sentimentScore / 100) * 8);

  if (creatorFrequency > 10) score += 8;
  else if (creatorFrequency > 5) score += 5;
  else if (creatorFrequency > 1) score += 2;

  if (botRatio > 0.7) score -= 30;
  else if (botRatio > 0.4) score -= 15;

  if (coordinationRisk > 70) score -= 20;
  else if (coordinationRisk > 50) score -= 10;

  return Math.min(Math.max(Math.round(score), 5), 100);
}