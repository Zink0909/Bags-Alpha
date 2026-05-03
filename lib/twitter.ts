const BEARER = process.env.X_BEARER_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

export interface TwitterSignal {
  tweetCount: number;
  totalEngagement: number;
  totalImpressions: number;
  attentionScore: number;
  qualityScore: number;
}

async function scoreTweetsWithClaude(tweets: string[]): Promise<number[]> {
  if (!ANTHROPIC_KEY || tweets.length === 0) return tweets.map(() => 5);

  try {
    const prompt = 'Rate these crypto token tweets. Reply ONLY with a JSON array of numbers 0-10 where 0=spam/bot/shill and 10=genuine community discussion with real insight. No markdown. Tweets: ' + JSON.stringify(tweets);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const scores = JSON.parse(clean);

    if (Array.isArray(scores) && scores.length === tweets.length) {
      return scores.map((s: any) => Math.min(Math.max(Number(s), 0), 10));
    }
    return tweets.map(() => 5);
  } catch {
    return tweets.map(() => 5);
  }
}

export async function getTwitterSignal(symbol: string): Promise<TwitterSignal> {
  if (!BEARER) return defaultSignal();

  try {
    const query = encodeURIComponent('$' + symbol + ' -is:retweet lang:en');
    const url = 'https://api.twitter.com/2/tweets/search/recent?query=' + query
      + '&max_results=10&tweet.fields=public_metrics,author_id'
      + '&expansions=author_id&user.fields=public_metrics';

    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + BEARER },
      next: { revalidate: 21600 },
    });

    const data = await res.json();
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

    const tweetTexts = tweets.map((t: any) => t.text.slice(0, 200));
    const qualityScores = await scoreTweetsWithClaude(tweetTexts);
    const avgQuality = qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length;
    const qualityScore = Math.round(avgQuality * 10);

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
      qualityScore
    );

    return { tweetCount, totalEngagement, totalImpressions, attentionScore, qualityScore };
  } catch {
    return defaultSignal();
  }
}

function defaultSignal(): TwitterSignal {
  return { tweetCount: 0, totalEngagement: 0, totalImpressions: 0, attentionScore: 5, qualityScore: 0 };
}

function computeAttentionScore(
  count: number,
  weightedEngagement: number,
  impressions: number,
  botRatio: number,
  qualityScore: number
): number {
  if (count === 0) return 5;

  let score = 15;

  score += Math.min(count * 1.5, 15);
  score += Math.min(weightedEngagement * 2, 35);

  const avgImpression = impressions / count;
  if (avgImpression > 1000) score += 15;
  else if (avgImpression > 100) score += 8;
  else if (avgImpression > 10) score += 3;

  score += Math.round((qualityScore / 100) * 20);

  if (botRatio > 0.7) score -= 30;
  else if (botRatio > 0.4) score -= 15;

  return Math.min(Math.max(Math.round(score), 5), 100);
}
