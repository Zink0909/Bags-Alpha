import {
  getFeed, getLifetimeFees, getClaimStats, getPool, getCreators,
  getAssetMetadata, getAllPools
} from './bags';
import {
  computeTag, computePotentialScore, computeRiskScore,
  feesToConversionScore, placeholderAttentionScore,
  type TokenScore
} from './score';
import { getTwitterSignal } from './twitter';

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

      const [feesRaw, claimRaw, poolRaw, twitterRaw] = await Promise.allSettled([
        getLifetimeFees(mint),
        getClaimStats(mint),
        getPool(mint),
        token.twitter && token.symbol ? getTwitterSignal(token.symbol) : Promise.resolve(null),
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

      const twitterSignal = twitterRaw.status === 'fulfilled' && twitterRaw.value
        ? twitterRaw.value
        : null;

      const attentionScore = twitterSignal
        ? twitterSignal.attentionScore
        : placeholderAttentionScore(token.twitter || '');

      const qualityScore = twitterSignal?.qualityScore || 0;
      const tweetCount = twitterSignal?.tweetCount || 0;

      const conversionScore = feesToConversionScore(lifetimeFeesSol);
      const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore);
      const riskScore = computeRiskScore(isGraduated, lifetimeFeesSol, !!(token.twitter));
      const tag = computeTag(attentionScore, conversionScore, momentumScore);

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
        qualityScore,
        tweetCount,
        conversionScore,
        momentumScore,
        potentialScore,
        riskScore,
        tag,
        sentimentScore: twitterSignal?.sentimentScore || 0,
        creatorPostFrequency: twitterSignal?.creatorPostFrequency || 0,
      } as TokenScore;
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<TokenScore>).value)
    .filter(t => t.lifetimeFeesSol > 0 || t.hasPool)
    .sort((a, b) => b.potentialScore - a.potentialScore);
}

export async function analyzePools(limit = 50): Promise<TokenScore[]> {
  const allPools = await getAllPools();
  if (!allPools || !Array.isArray(allPools)) return [];

  const shuffled = allPools.sort(() => Math.random() - 0.5).slice(0, 200);

  const withFees = await Promise.allSettled(
    shuffled.map(async (pool: any) => {
      const feesRaw = await getLifetimeFees(pool.tokenMint);
      const sol = safeLamports(feesRaw);
      if (sol < 0.05 || sol > 5) return null;
      return { mint: pool.tokenMint, sol, isGraduated: !!pool.dammV2PoolKey };
    })
  );

  const sweetspot = withFees
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<any>).value)
    .sort((a, b) => b.sol - a.sol)
    .slice(0, limit);

  const results = await Promise.allSettled(
    sweetspot.map(async (p: any) => {
      const [meta, creatorsRaw, claimRaw] = await Promise.allSettled([
        getAssetMetadata(p.mint),
        getCreators(p.mint),
        getClaimStats(p.mint),
      ]);

      const metadata = meta.status === 'fulfilled' ? meta.value : { name: '', symbol: '', image: '' };
      const creators = creatorsRaw.status === 'fulfilled' ? (creatorsRaw.value || []) : [];
      const claimData = claimRaw.status === 'fulfilled' ? (claimRaw.value || []) : [];

      const totalClaimed = Array.isArray(claimData)
        ? claimData.reduce((sum: number, c: any) => sum + safeLamports(c.totalClaimed), 0)
        : 0;

      const twitterUrl = creators[0]?.twitterUsername
        ? 'https://x.com/' + creators[0].twitterUsername
        : '';

      const unclaimedRatio = p.sol > 0
        ? Math.min((p.sol - totalClaimed) / p.sol, 1)
        : 0;
      const momentumScore = Math.round(unclaimedRatio * 100);

      const twitterSignal = metadata.symbol && twitterUrl
        ? await getTwitterSignal(metadata.symbol).catch(() => null)
        : null;

      const attentionScore = twitterSignal
        ? twitterSignal.attentionScore
        : placeholderAttentionScore(twitterUrl);

      const qualityScore = twitterSignal?.qualityScore || 0;
      const tweetCount = twitterSignal?.tweetCount || 0;

      const conversionScore = feesToConversionScore(p.sol);
      const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore);
      const riskScore = computeRiskScore(p.isGraduated, p.sol, !!twitterUrl);
      const tag = computeTag(attentionScore, conversionScore, momentumScore);

      return {
        mint: p.mint,
        name: metadata.name,
        symbol: metadata.symbol,
        twitter: twitterUrl,
        image: metadata.image,
        status: p.isGraduated ? 'GRADUATED' : 'PRE_GRAD',
        lifetimeFeesSol: p.sol,
        feeVelocity: totalClaimed,
        hasPool: true,
        isGraduated: p.isGraduated,
        creatorTwitter: twitterUrl,
        attentionScore,
        qualityScore,
        tweetCount,
        conversionScore,
        momentumScore,
        potentialScore,
        riskScore,
        tag,
        sentimentScore: twitterSignal?.sentimentScore || 0,
        creatorPostFrequency: twitterSignal?.creatorPostFrequency || 0,
      } as TokenScore;
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<TokenScore>).value)
    .sort((a, b) => b.potentialScore - a.potentialScore);
}