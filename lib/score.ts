export interface TokenScore {
  mint: string;
  name: string;
  symbol: string;
  twitter: string;
  image: string;
  status: string;

  // raw data
  lifetimeFeesSol: number;
  feeVelocity: number;
  hasPool: boolean;
  isGraduated: boolean;
  creatorTwitter: string;

  // scores 0-100
  attentionScore: number;
  qualityScore: number;      // Claude NLP quality score 0-100
  tweetCount: number;        // number of tweets found
  sentimentScore: number;        // -100 to +100
  creatorPostFrequency: number;  // posts per week
  conversionScore: number;
  momentumScore: number;

  potentialScore: number;
  riskScore: number;

  // classification
  tag: 'Breakout' | 'Fake Hype' | 'Stealth Gem' | 'No Signal';
}

export function computeTag(
  attentionScore: number,
  conversionScore: number,
  momentumScore: number
): TokenScore['tag'] {
  const highAttention = attentionScore > 50;
  const hasConversion = conversionScore > 20;
  const hasActivity = conversionScore > 5 || momentumScore > 10;

  if (highAttention && hasConversion) return 'Breakout';
  if (highAttention && !hasActivity) return 'Fake Hype';
  if (!highAttention && hasConversion) return 'Stealth Gem';
  return 'No Signal';
}

export function computePotentialScore(
  attention: number,
  conversion: number,
  momentum: number
): number {
  return Math.round(0.3 * attention + 0.4 * conversion + 0.3 * momentum);
}

export function computeRiskScore(
  isGraduated: boolean,
  lifetimeFeesSol: number,
  hasTwitter: boolean
): number {
  let risk = 40; // lower baseline

  if (!isGraduated) risk += 15;
  if (lifetimeFeesSol < 0.01) risk += 25;
  else if (lifetimeFeesSol < 0.1) risk += 10;
  else if (lifetimeFeesSol > 1) risk -= 10; // high fees = lower risk
  if (!hasTwitter) risk += 10;

  return Math.min(Math.max(risk, 10), 100);
}

// Convert lifetime fees SOL to a 0-100 conversion score
// 0.001 SOL = 5, 0.01 = 20, 0.1 = 50, 1 SOL = 80, 10+ SOL = 100
export function feesToConversionScore(sol: number): number {
  if (sol <= 0) return 0;
  const log = Math.log10(sol + 0.0001);
  const score = ((log + 4) / 5) * 100;
  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Conservative fallback when X API is unavailable
// Does NOT give high scores — only real X data should give high attention
export function placeholderAttentionScore(twitterUrl: string): number {
  if (!twitterUrl) return 5;
  return 25; // has twitter but no real data yet
}
