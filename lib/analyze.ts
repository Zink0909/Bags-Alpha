import {
  getFeed, getLifetimeFees, getClaimStats, getPool
} from './bags';
import {
  computeTag, computePotentialScore, computeRiskScore,
  feesToConversionScore, placeholderAttentionScore,
  type TokenScore
} from './score';

function safeLamports(val: any): number {
  if (!val || typeof val !== 'string') return 0;
  try { return Number(BigInt(val)) / 1e9; } catch { return 0; }
}

export async function analyzeTokens(limit = 50): Promise<TokenScore[]> {
  const feed = await getFeed();
  if (!feed || !Array.isArray(feed)) return [];

  const tokens = feed.slice(0, limit);

  const results = await Promise.allSettled(
    tokens.map(async (token: any) => {
      const mint = token.tokenMint;

      const [feesRaw, claimRaw, poolRaw] = await Promise.allSettled([
        getLifetimeFees(mint),
        getClaimStats(mint),
        getPool(mint),
      ]);

      const lifetimeFeesSol = feesRaw.status === 'fulfilled'
        ? safeLamports(feesRaw.value)
        : 0;

      const claimData = claimRaw.status === 'fulfilled' ? claimRaw.value : [];
      const totalClaimed = Array.isArray(claimData)
        ? claimData.reduce((sum: number, c: any) => sum + safeLamports(c.totalClaimed), 0)
        : 0;

      const unclaimedRatio = lifetimeFeesSol > 0
        ? Math.min((lifetimeFeesSol - totalClaimed) / lifetimeFeesSol, 1)
        : 0;
      const momentumScore = Math.round(unclaimedRatio * 100);

      const poolData = poolRaw.status === 'fulfilled' ? poolRaw.value : null;
      const isGraduated = !!poolData?.dammV2PoolKey;
      const hasPool = !!poolData;

      const attentionScore = placeholderAttentionScore(token.twitter || '');
      const conversionScore = feesToConversionScore(lifetimeFeesSol);
      const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore);
      const riskScore = computeRiskScore(isGraduated, lifetimeFeesSol, !!(token.twitter));
      const tag = computeTag(attentionScore, conversionScore);

      return {
        mint,
        name: token.name,
        symbol: token.symbol,
        twitter: token.twitter || '',
        image: token.image || '',
        status: token.status,
        lifetimeFeesSol,
        feeVelocity: totalClaimed,
        hasPool,
        isGraduated,
        creatorTwitter: token.twitter || '',
        attentionScore,
        conversionScore,
        momentumScore,
        potentialScore,
        riskScore,
        tag,
      } as TokenScore;
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<TokenScore>).value)
    .filter(t => t.lifetimeFeesSol > 0 || t.hasPool)
    .sort((a, b) => b.potentialScore - a.potentialScore);
}
