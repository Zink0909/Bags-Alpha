import {
  getFeed, getLifetimeFees, getClaimStats, getPool
} from './bags';
import {
  computeTag, computePotentialScore, computeRiskScore,
  feesToConversionScore, placeholderAttentionScore,
  type TokenScore
} from './score';

export async function analyzeTokens(limit = 20): Promise<TokenScore[]> {
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

      // lifetime fees
      const feesStr = feesRaw.status === 'fulfilled' ? feesRaw.value : '0';
      const lifetimeFeesSol = Number(BigInt(feesStr || '0')) / 1e9;

      // claim stats — totalClaimed 作为 momentum proxy
      const claimData = claimRaw.status === 'fulfilled' ? claimRaw.value : [];
      const totalClaimed = Array.isArray(claimData)
        ? claimData.reduce((sum: number, c: any) => {
            return sum + Number(BigInt(c.totalClaimed || '0')) / 1e9;
          }, 0)
        : 0;

      // unclaimed = lifetime - claimed，比例越高说明 fee 积累越快（momentum）
      const unclaimedRatio = lifetimeFeesSol > 0
        ? Math.min((lifetimeFeesSol - totalClaimed) / lifetimeFeesSol, 1)
        : 0;
      const momentumScore = Math.round(unclaimedRatio * 100);

      // pool
      const poolData = poolRaw.status === 'fulfilled' ? poolRaw.value : null;
      const isGraduated = !!poolData?.dammV2PoolKey;
      const hasPool = !!poolData;

      // scores
      const attentionScore = placeholderAttentionScore(token.twitter || '');
      const conversionScore = feesToConversionScore(lifetimeFeesSol);
      const potentialScore = computePotentialScore(
        attentionScore, conversionScore, momentumScore
      );
      const riskScore = computeRiskScore(
        isGraduated, lifetimeFeesSol, !!(token.twitter)
      );
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
    .sort((a, b) => b.potentialScore - a.potentialScore);
}
