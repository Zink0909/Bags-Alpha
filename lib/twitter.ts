const BEARER = process.env.X_BEARER_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

export interface TweetAnalysis {
  quality: number;      // 0-10
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TwitterSignal {
  tweetCount: number;
  totalEngagement: number;
  totalImpressions: number;
  attentionScore: number;
  qualityScore: number;
  sentimentScore: number;    // -100 to +100
  creatorPostFrequency: number; // posts per week
}

async function analyzeTweetsWithClaude(tweets: string[]): Promise<TweetAnalysis[]> {
  if (!ANTHROPIC_KEY || tweets.length === 0) {
    return tweets.map(() => ({ quality: 5, sentiment: 'neutral' as const }));
  }

  try {
    const prompt = 'Analyze these crypto token tweets. Reply ONLY with a JSON array, no markdown, no explanation. Each item: {"quality":0-10,"sentiment":"positive"|"negative"|"neutral"} where quality: 0=spam/bot/shill, 10=genuine insight with real analysis. sentiment: positive=bullish/supportive, negative=bearish/warning/dump, neutral=informational. Tweets: ' + JSON.stringify(tweets);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
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
    // Get user ID first
    const userRes = await fetch(
      'https://api.twitter.com/2/users/by/username/' + username + '?user.fields=public_metrics',
      {
        headers: { 'Authorization': 'Bearer ' + BEARER },
        next: { revalidate: 86400 }, // cache 24h
      }
    );
    const userData = await userRes.json();
    if (!userData.data?.id) return 0;

    const userId = userData.data.id;

    // Get recent tweets
    const tweetsRes = await fetch(
      'https://api.twitter.com/2/users/' + userId + '/tweets?max_results=10&tweet.fields=created_at',
      {
        headers: { 'Authorization': 'Bearer ' + BEARER },
        next: { revalidate: 21600 },
      }
    );
    const tweetsData = await tweetsRes.json();
    if (!tweetsData.data || tweetsData.data.length < 2) return 0;

    // Calculate posts per week based on time span
    const times = tweetsData.data.map((t: any) => new Date(t.created_at).getTime());
    const newest = Math.max(...times);
    const oldest = Math.min(...times);
    const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);
    if (daySpan === 0) return 7; // all today

    const postsPerDay = tweetsData.data.length / daySpan;
    return Math.round(postsPerDay * 7 * 10) / 10; // posts per week, 1 decimal
  } catch {
    return 0;
  }
}

export async function getTwitterSignal(
  symbol: string,
  creatorUsername?: string
): Promise<TwitterSignal> {
  if (!BEARER) return defaultSignal();

  try {
    const query = encodeURIComponent('$' + symbol + ' -is:retweet lang:en');
    const url = 'https://api.twitter.com/2/tweets/search/recent?query=' + query
      + '&max_results=10&tweet.fields=public_metrics,author_id'
      + '&expansions=author_id&user.fields=public_metrics';

    const [tweetRes, creatorFreq] = await Promise.all([
      fetch(url, {
        headers: { 'Authorization': 'Bearer ' + BEARER },
        next: { revalidate: 21600 },
      }),
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

    // Claude NLP: quality + sentiment
    const tweetTexts = tweets.map((t: any) => t.text.slice(0, 200));
    const analyses = await analyzeTweetsWithClaude(tweetTexts);

    const qualityScores = analyses.map(a => a.quality);
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const qualityScore = Math.round(avgQuality * 10);

    // Sentiment score: -100 to +100
    const sentimentValues: number[] = analyses.map(a =>
      a.sentiment === 'positive' ? 1 : a.sentiment === 'negative' ? -1 : 0
    );
    const avgSentiment = sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length;
    const sentimentScore = Math.round(avgSentiment * 100);

    // KOL-weighted engagement with quality
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
      tweetCount,
      weightedEngagement,
      totalImpressions,
      botRatio,
      qualityScore,
      sentimentScore,
      creatorFreq
    );

    return {
      tweetCount,
      totalEngagement,
      totalImpressions,
      attentionScore,
      qualityScore,
      sentimentScore,
      creatorPostFrequency: creatorFreq,
    };
  } catch {
    return defaultSignal();
  }
}

function defaultSignal(): TwitterSignal {
  return {
    tweetCount: 0,
    totalEngagement: 0,
    totalImpressions: 0,
    attentionScore: 5,
    qualityScore: 0,
    sentimentScore: 0,
    creatorPostFrequency: 0,
  };
}

function computeAttentionScore(
  count: number,
  weightedEngagement: number,
  impressions: number,
  botRatio: number,
  qualityScore: number,
  sentimentScore: number,
  creatorFrequency: number
): number {
  if (count === 0) return 5;

  let score = 15;

  // Tweet count (max +15)
  score += Math.min(count * 1.5, 15);

  // KOL-weighted quality engagement (max +30)
  score += Math.min(weightedEngagement * 2, 30);

  // Impression quality (max +12)
  const avgImpression = impressions / count;
  if (avgImpression > 1000) score += 12;
  else if (avgImpression > 100) score += 6;
  else if (avgImpression > 10) score += 3;

  // Claude quality bonus (max +15)
  score += Math.round((qualityScore / 100) * 15);

  // Sentiment bonus/penalty (max +-8)
  score += Math.round((sentimentScore / 100) * 8);

  // Creator activity bonus (max +8)
  if (creatorFrequency > 10) score += 8;
  else if (creatorFrequency > 5) score += 5;
  else if (creatorFrequency > 1) score += 2;

  // Bot penalty
  if (botRatio > 0.7) score -= 30;
  else if (botRatio > 0.4) score -= 15;

  return Math.min(Math.max(Math.round(score), 5), 100);
}