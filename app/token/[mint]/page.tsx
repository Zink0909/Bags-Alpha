import { getLifetimeFees, getCreators, getClaimStats, getPool, getQuote, SOL_MINT } from '@/lib/bags';
import { feesToConversionScore, placeholderAttentionScore, computeRiskScore, computeTag, computePotentialScore } from '@/lib/score';

export const revalidate = 60;

export default async function TokenDetail({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  const [feesRaw, creatorsRaw, claimRaw, poolRaw, quoteRaw] = await Promise.allSettled([
    getLifetimeFees(mint),
    getCreators(mint),
    getClaimStats(mint),
    getPool(mint),
    getQuote(SOL_MINT, mint, 1_000_000_000),
  ]);

  const feesStr = feesRaw.status === 'fulfilled' && typeof feesRaw.value === 'string' ? feesRaw.value : '0';
  const lifetimeFeesSol = Number(BigInt(feesStr || '0')) / 1e9;
  const creators = creatorsRaw.status === 'fulfilled' ? (creatorsRaw.value || []) : [];
  const claimData = claimRaw.status === 'fulfilled' ? (claimRaw.value || []) : [];
  const pool = poolRaw.status === 'fulfilled' ? poolRaw.value : null;
  const quote = quoteRaw.status === 'fulfilled' ? quoteRaw.value : null;

  const totalClaimed = Array.isArray(claimData)
    ? claimData.reduce((sum: number, c: any) => sum + Number(BigInt(c.totalClaimed || '0')) / 1e9, 0)
    : 0;

  const isGraduated = !!pool?.dammV2PoolKey;
  const mainCreator = creators[0];
  const twitterUrl = mainCreator?.twitterUsername
    ? 'https://x.com/' + mainCreator.twitterUsername
    : '';

  const attentionScore = placeholderAttentionScore(twitterUrl);
  const conversionScore = feesToConversionScore(lifetimeFeesSol);
  const unclaimedRatio = lifetimeFeesSol > 0 ? Math.min((lifetimeFeesSol - totalClaimed) / lifetimeFeesSol, 1) : 0;
  const momentumScore = Math.round(unclaimedRatio * 100);
  const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore);
  const riskScore = computeRiskScore(isGraduated, lifetimeFeesSol, !!twitterUrl);
  const tag = computeTag(attentionScore, conversionScore);

  const TAG_COLORS: Record<string, string> = {
    'Breakout': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    'Fake Hype': 'text-red-400 border-red-400/30 bg-red-400/10',
    'Stealth Gem': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    'No Signal': 'text-white/30 border-white/10 bg-white/5',
  };
  const tagColor = TAG_COLORS[tag] ?? TAG_COLORS['No Signal'];

  const priceImpact = quote?.priceImpactPct ? parseFloat(quote.priceImpactPct) : null;
  const outAmount = quote?.outAmount ? (Number(BigInt(quote.outAmount)) / 1e6).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <a href="/" className="text-white/40 hover:text-white text-sm transition-colors">Back</a>
        <span className="text-white/20">|</span>
        <span className="text-sm font-bold text-white">BAGS</span>
        <span className="text-sm font-bold text-emerald-400">ALPHA</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <span className={"text-sm px-3 py-1 rounded border font-bold " + tagColor}>
            {tag}
          </span>
          <div className="text-right">
            <div className="text-xs text-white/40 mb-1">Potential Score</div>
            <div className="text-3xl font-bold text-white">{potentialScore}</div>
          </div>
        </div>

        <div className="border border-white/10 rounded-lg p-5">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">Score Breakdown</div>
          <div className="space-y-3">
            {[
              { label: 'Attention', value: attentionScore, desc: 'Social signal strength', color: 'bg-blue-400' },
              { label: 'Conversion', value: conversionScore, desc: 'On-chain trading activity', color: 'bg-emerald-400' },
              { label: 'Momentum', value: momentumScore, desc: 'Fee velocity acceleration', color: 'bg-yellow-400' },
            ].map(({ label, value, desc, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{label} <span className="text-white/30">— {desc}</span></span>
                  <span className="text-white font-bold">{value}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={"h-full rounded-full " + color} style={{ width: value + '%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs">
            <span className="text-white/40">Risk Score</span>
            <span className={riskScore > 70 ? 'text-red-400 font-bold' : 'text-white/60'}>{riskScore} / 100</span>
          </div>
        </div>

        <div className="border border-white/10 rounded-lg p-5">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">On-Chain Activity</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-white/30 mb-1">Lifetime Fees</div>
              <div className="text-lg font-bold text-emerald-400">{lifetimeFeesSol.toFixed(4)}</div>
              <div className="text-xs text-white/30">SOL</div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Total Claimed</div>
              <div className="text-lg font-bold text-white">{totalClaimed.toFixed(4)}</div>
              <div className="text-xs text-white/30">SOL</div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Unclaimed</div>
              <div className="text-lg font-bold text-yellow-400">{(lifetimeFeesSol - totalClaimed).toFixed(4)}</div>
              <div className="text-xs text-white/30">SOL</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/40">
            <span>Pool status</span>
            <span className={isGraduated ? 'text-emerald-400' : 'text-yellow-400'}>
              {isGraduated ? 'Graduated to DAMM v2' : 'Pre-graduation (DBC)'}
            </span>
          </div>
        </div>

        {creators.length > 0 && (
          <div className="border border-white/10 rounded-lg p-5">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-4">Creator</div>
            <div className="space-y-3">
              {creators.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {c.pfp && (
                      <img src={c.pfp} alt="" width={32} height={32} className="rounded-full w-8 h-8" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {c.providerUsername || c.twitterUsername || c.bagsUsername || 'Unknown'}
                      </div>
                      <div className="text-xs text-white/30">
                        {c.provider} · {c.isCreator ? 'Creator' : 'Admin'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{(c.royaltyBps / 100).toFixed(0)}%</div>
                    <div className="text-xs text-white/30">fee share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-white/10 rounded-lg p-5">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">Entry Simulation — Buy 1 SOL</div>
          {quote && outAmount ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/30 mb-1">You receive</div>
                <div className="text-xl font-bold text-white">{outAmount}</div>
                <div className="text-xs text-white/30">tokens</div>
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1">Price impact</div>
                <div className={"text-xl font-bold " + (priceImpact && priceImpact > 5 ? 'text-red-400' : 'text-emerald-400')}>
                  {priceImpact ? priceImpact.toFixed(2) + '%' : 'N/A'}
                </div>
                <div className="text-xs text-white/30">
                  {priceImpact && priceImpact > 5 ? 'High impact — caution' : 'Acceptable'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/30">Quote unavailable for this token</div>
          )}
        </div>

        <a
          href={"https://bags.fm/token/" + mint}
          className="block text-center py-3 rounded-lg border border-emerald-400/30 text-emerald-400 text-sm font-bold hover:bg-emerald-400/10 transition-colors"
        >
          Trade on Bags.fm
        </a>

      </main>
    </div>
  );
}
