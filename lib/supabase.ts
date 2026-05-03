import { createClient } from '@supabase/supabase-js';

export const getSupabase = () => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key);
};

export async function saveSnapshot(tokens: any[]) {
  if (!tokens.length) return;

  const supabase = getSupabase();

  const rows = tokens.map(t => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    image: t.image || '',
    twitter: t.twitter || '',
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

export async function getLatestSnapshot() {
  const supabase = getSupabase();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('token_snapshots')
    .select('*')
    .gte('captured_at', oneDayAgo)
    .order('captured_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Supabase read error:', error);
    return [];
  }

  // deduplicate: keep only the latest snapshot per mint
  const seen = new Set<string>();
  const unique = (data || []).filter((row: any) => {
    if (seen.has(row.mint)) return false;
    seen.add(row.mint);
    return true;
  });

  // sort by potential_score descending
  unique.sort((a: any, b: any) => (b.potential_score || 0) - (a.potential_score || 0));

  return unique.slice(0, 100).map((row: any) => ({
    mint: row.mint,
    name: row.name || '',
    symbol: row.symbol || '',
    twitter: row.twitter || '',
    image: row.image || '',
    status: 'PRE_GRAD',
    lifetimeFeesSol: row.lifetime_fees_sol || 0,
    feeVelocity: 0,
    hasPool: true,
    isGraduated: false,
    creatorTwitter: row.twitter || '',
    attentionScore: row.attention_score || 5,
    conversionScore: row.conversion_score || 0,
    momentumScore: row.momentum_score || 0,
    potentialScore: row.potential_score || 0,
    riskScore: row.risk_score || 50,
    tag: row.tag || 'No Signal',
  }));
}

export async function getFeeHistory(mint: string, hours = 24) {
  const supabase = getSupabase();
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