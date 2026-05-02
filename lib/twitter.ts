const BEARER = process.env.X_BEARER_TOKEN!;

export interface TwitterSignal {
  tweetCount: number;
  totalEngagement: number;
  totalImpressions: number;
  attentionScore: number;
}

export async function getTwitterSignal(symbol: string): Promise<TwitterSignal> {
  if (!BEARER) return defaultSignal();
  
  try {
    const query = encodeURIComponent('$' + symbol + ' -is:retweet');
    const url = 'https://api.twitter.com/2/tweets/search/recent?query=' + query
      + '&max_results=10&tweet.fields=public_metrics';
    
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + BEARER },
      next: { revalidate: 3600 }
    });
    
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return defaultSignal();
    
    const tweets = data.data;
    const tweetCount = tweets.length;
    
    let totalEngagement = 0;
    let totalImpressions = 0;
    
    for (const tweet of tweets) {
      const m = tweet.public_metrics;
      totalEngagement += (m.like_count + m.retweet_count + m.reply_count + m.quote_count);
      totalImpressions += m.impression_count;
    }
    
    const attentionScore = computeAttentionScore(tweetCount, totalEngagement, totalImpressions);
    
    return { tweetCount, totalEngagement, totalImpressions, attentionScore };
  } catch {
    return defaultSignal();
  }
}

function defaultSignal(): TwitterSignal {
  return { tweetCount: 0, totalEngagement: 0, totalImpressions: 0, attentionScore: 10 };
}

function computeAttentionScore(count: number, engagement: number, impressions: number): number {
  if (count === 0) return 10;
  
  // 基础分：有推文就给30分
  let score = 30;
  
  // 推文数量加分（最多+30）
  score += Math.min(count * 3, 30);
  
  // 真实互动加分（likes + retweets，最多+30）
  score += Math.min(engagement * 2, 30);
  
  // 如果全是零互动推文，扣分（bot 信号）
  if (count > 0 && engagement === 0 && impressions < 10) {
    score -= 15;
  }
  
  return Math.min(Math.max(Math.round(score), 10), 100);
}