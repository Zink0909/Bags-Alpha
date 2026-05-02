import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export async function saveSnapshot(tokens: any[]) {
  if (!tokens.length) return;
  
  const rows = tokens.map(t => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    lifetime_fees_sol: t.lifetimeFeesSol,
    attention_score: t.attentionScore,
    conversion_score: t.conversionScore,
    momentum_score: t.momentumScore,
    potential_score: t.potentialScore,
    risk_score: t.riskScore,
    tag: t.tag,
    tweet_count: t.tweetCount || 0,
    total_engagement: t.totalEngagement || 0,
    captured_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('token_snapshots')
    .insert(rows);

  if (error) console.error('Supabase insert error:', error);
  return !error;
}

export async function getFeeHistory(mint: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('token_snapshots')
    .select('lifetime_fees_sol, attention_score, captured_at')
    .eq('mint', mint)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });

  if (error) return [];
  return data || [];
}