import { getSupabase } from '@/lib/supabase';
import { getLifetimeFees, getClaimStats } from '@/lib/bags';
import { feesToConversionScore, computeTag, computePotentialScore, computeRiskScore, placeholderAttentionScore } from '@/lib/score';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint');
  if (!mint) return Response.json({ success: false, error: 'Missing mint' }, { status: 400 });

  // Try Supabase first (fast)
  const supabase = getSupabase();
  const { data } = await supabase
    .from('token_snapshots')
    .select('*')
    .eq('mint', mint)
    .order('captured_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const row = data[0];
    return Response.json({
      success: true,
      source: 'cache',
      mint,
      symbol: row.symbol,
      name: row.name,
      tag: row.tag,
      potentialScore: row.potential_score,
      attentionScore: row.attention_score,
      conversionScore: row.conversion_score,
      momentumScore: row.momentum_score,
      riskScore: row.risk_score,
      lifetimeFeesSol: row.lifetime_fees_sol,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Fallback: compute live
  try {
    function safeLamports(val: any): number {
      if (!val || typeof val !== 'string') return 0;
      try { return Number(BigInt(val)) / 1e9; } catch { return 0; }
    }

    const [feesRaw, claimRaw] = await Promise.allSettled([
      getLifetimeFees(mint),
      getClaimStats(mint),
    ]);

    const lifetimeFeesSol = feesRaw.status === 'fulfilled' ? safeLamports(feesRaw.value) : 0;
    const claimData = claimRaw.status === 'fulfilled' ? claimRaw.value : [];
    const totalClaimed = Array.isArray(claimData)
      ? claimData.reduce((sum: number, c: any) => sum + safeLamports(c.totalClaimed), 0)
      : 0;

    const attentionScore = 10;
    const conversionScore = feesToConversionScore(lifetimeFeesSol);
    const unclaimedRatio = lifetimeFeesSol > 0 ? Math.min((lifetimeFeesSol - totalClaimed) / lifetimeFeesSol, 1) : 0;
    const momentumScore = Math.round(unclaimedRatio * 100);
    const riskScore = computeRiskScore(false, lifetimeFeesSol, false);
    const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore, riskScore);
    const tag = computeTag(attentionScore, conversionScore, momentumScore);

    return Response.json({
      success: true,
      source: 'live',
      mint,
      symbol: '',
      name: '',
      tag,
      potentialScore,
      attentionScore,
      conversionScore,
      momentumScore,
      riskScore,
      lifetimeFeesSol,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
