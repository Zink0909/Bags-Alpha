export interface TokenScore {
  mint: string;
  name: string;
  symbol: string;
  twitter: string;
  image: string;
  status: string;
  
  // raw data
  lifetimeFeesSol: number;
  feeVelocity: number;       // fees claimed in last 24h (proxy for recent volume)
  hasPool: boolean;
  isGraduated: boolean;
  creatorTwitter: string;
  
  // scores 0-100
  attentionScore: number;    // from X mentions (placeholder for now)
  conversionScore: number;   // from fees + velocity
  momentumScore: number;     // rate of change
  
  potentialScore: number;    // weighted composite
  riskScore: number;         // 0=low risk, 100=high risk
  
  // classification
  tag: 'Breakout' | 'Fake Hype' | 'Stealth Gem' | 'No Signal';
}

export function computeTag(
  attentionScore: number,
  conversionScore: number
): TokenScore['tag'] {
  const highAttention = attentionScore > 50;
  const hasConversion = conversionScore > 20;

  if (highAttention && hasConversion) return 'Breakout';
  if (highAttention && !hasConversion) return 'Fake Hype';
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
  let risk = 50; // baseline
  if (!isGraduated) risk += 20;   // not graduated = thinner liquidity
  if (lifetimeFeesSol < 0.01) risk += 20; // very low fees = low activity
  if (!hasTwitter) risk += 10;    // no social presence
  return Math.min(risk, 100);
}

// Convert lifetime fees SOL to a 0-100 conversion score
// Calibrated: 0.001 SOL = 5, 0.01 = 20, 0.1 = 50, 1 SOL = 80, 10+ SOL = 100
export function feesToConversionScore(sol: number): number {
  if (sol <= 0) return 0;
  const log = Math.log10(sol + 0.0001);
  // log10(0.0001) = -4, log10(10) = 1
  // map [-4, 1] -> [0, 100]
  const score = ((log + 4) / 5) * 100;
  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Placeholder: attention score from Twitter handle existence
// Will be replaced with real X API data
export function placeholderAttentionScore(twitterUrl: string): number {
  if (!twitterUrl) return 10;
  if (twitterUrl.includes('/status/')) return 80;
  return 60;
}
