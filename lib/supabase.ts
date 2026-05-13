import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }
  return _client;
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
    .limit(200);

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

  return unique.slice(0, 200).map((row: any) => ({
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
    qualityScore: row.quality_score || 0,
    tweetCount: row.tweet_count || 0,
    sentimentScore: row.sentiment_score || 0,
    creatorPostFrequency: row.creator_post_frequency || 0,
    coordinationRisk: row.coordination_risk || 0,
    capturedAt: row.captured_at || '',
  }));
}

export async function getPreviousFeesMap(mints: string[]): Promise<Record<string, number>> {
  if (!mints.length) return {};
  const supabase = getSupabase();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('token_snapshots')
    .select('mint, lifetime_fees_sol, captured_at')
    .in('mint', mints)
    .gte('captured_at', since)
    .order('captured_at', { ascending: false });
  if (!data) return {};
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!(row.mint in map)) map[row.mint] = row.lifetime_fees_sol;
  }
  return map;
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

export async function getHistoricalPattern(tag: string, scoreMin: number, scoreMax: number) {
  const supabase = getSupabase();

  // Get all snapshots for tokens with this tag and score range
  const { data } = await supabase
    .from('token_snapshots')
    .select('mint, potential_score, lifetime_fees_sol, captured_at')
    .eq('tag', tag)
    .gte('potential_score', scoreMin)
    .lte('potential_score', scoreMax)
    .order('captured_at', { ascending: true });

  if (!data || data.length === 0) return null;

  // Group by mint, find pairs where we have before/after
  const byMint: Record<string, any[]> = {};
  for (const row of data) {
    if (!byMint[row.mint]) byMint[row.mint] = [];
    byMint[row.mint].push(row);
  }

  const deltas: number[] = [];
  const timeSpans: number[] = [];

  for (const rows of Object.values(byMint)) {
    if (rows.length < 2) continue;
    const first = rows[0].lifetime_fees_sol;
    const last = rows[rows.length - 1].lifetime_fees_sol;
    deltas.push(last - first);
    const firstMs = new Date(rows[0].captured_at).getTime();
    const lastMs = new Date(rows[rows.length - 1].captured_at).getTime();
    timeSpans.push((lastMs - firstMs) / (1000 * 60 * 60));
  }

  if (deltas.length === 0) return null;

  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor((deltas.length - 1) / 2)];
  const positive = deltas.filter(d => d > 0).length;
  const positivePct = Math.round((positive / deltas.length) * 100);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const hoursObserved = Math.round(timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length);

  return {
    sampleSize: deltas.length,
    medianFeeDelta: median,
    avgFeeDelta: avgDelta,
    positiveRatePct: positivePct,
    hoursObserved,
  };
}

export async function getTokenMetadata(mint: string): Promise<{ symbol: string; name: string; image: string; twitter: string; capturedAt: string } | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('token_snapshots')
    .select('symbol, name, image, twitter, captured_at')
    .eq('mint', mint)
    .not('symbol', 'eq', '')
    .order('captured_at', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return null;
  return {
    symbol: data[0].symbol || '',
    name: data[0].name || '',
    image: data[0].image || '',
    twitter: data[0].twitter || '',
    capturedAt: data[0].captured_at || '',
  };
}

export async function getCreatorTokens(username: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('token_snapshots')
    .select('*')
    .ilike('twitter', '%/' + username)
    .order('captured_at', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  // deduplicate by mint, keep latest
  const seen = new Set<string>();
  return data.filter((row: any) => {
    if (seen.has(row.mint)) return false;
    seen.add(row.mint);
    return true;
  });
}

export async function getTopTokens(limit = 10) {
  const supabase = getSupabase();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('token_snapshots')
    .select('*')
    .gte('captured_at', oneDayAgo)
    .order('lifetime_fees_sol', { ascending: false })
    .limit(500);

  if (error || !data) return [];

  // deduplicate by mint
  const seen = new Set<string>();
  const unique = data.filter((row: any) => {
    if (seen.has(row.mint)) return false;
    seen.add(row.mint);
    return true;
  });

  return unique.slice(0, limit).map((row: any) => ({
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
    qualityScore: row.quality_score || 0,
    tweetCount: row.tweet_count || 0,
    sentimentScore: row.sentiment_score || 0,
    coordinationRisk: row.coordination_risk || 0,
    creatorPostFrequency: row.creator_post_frequency || 0,
    conversionScore: row.conversion_score || 0,
    momentumScore: row.momentum_score || 0,
    potentialScore: row.potential_score || 0,
    riskScore: row.risk_score || 50,
    tag: row.tag || 'No Signal',
    capturedAt: row.captured_at || '',
  }));
}