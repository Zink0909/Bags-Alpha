import { getLifetimeFees, getCreators, getClaimStats, getPool, getQuote, SOL_MINT, getFeed } from '@/lib/bags';
import { feesToConversionScore, placeholderAttentionScore, computeRiskScore, computeTag, computePotentialScore } from '@/lib/score';
import { getTwitterSignal } from '@/lib/twitter';

export const revalidate = 3600;

export default async function TokenDetail({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  const [feesRaw, creatorsRaw, claimRaw, poolRaw, quoteRaw, feedRaw] = await Promise.allSettled([
    getLifetimeFees(mint),
    getCreators(mint),
    getClaimStats(mint),
    getPool(mint),
    getQuote(SOL_MINT, mint, 1_000_000_000),
    getFeed(),
  ]);

  const feesVal = feesRaw.status === 'fulfilled' ? feesRaw.value : null;
  const feesStr = typeof feesVal === 'string' ? feesVal : '0';
  const lifetimeFeesSol = Number(BigInt(feesStr || '0')) / 1e9;

  const creators = creatorsRaw.status === 'fulfilled' ? (creatorsRaw.value || []) : [];
  const claimData = claimRaw.status === 'fulfilled' ? (claimRaw.value || []) : [];
  const pool = poolRaw.status === 'fulfilled' ? poolRaw.value : null;
  const quote = quoteRaw.status === 'fulfilled' ? quoteRaw.value : null;
  const feed = feedRaw.status === 'fulfilled' ? feedRaw.value : [];

  const feedToken = Array.isArray(feed) ? feed.find((t: any) => t.tokenMint === mint) : null;
  const tokenSymbol = feedToken?.symbol || '';
  const tokenName = feedToken?.name || '';
  const tokenImage = feedToken?.image || '';

  const totalClaimed = Array.isArray(claimData)
    ? claimData.reduce((sum: number, c: any) => {
        try { return sum + Number(BigInt(c.totalClaimed || '0')) / 1e9; } catch { return sum; }
      }, 0)
    : 0;

  const isGraduated = !!pool?.dammV2PoolKey;
  const mainCreator = creators[0];
  const twitterUrl = mainCreator?.twitterUsername ? 'https://x.com/' + mainCreator.twitterUsername : '';

  const twitterSignal = tokenSymbol ? await getTwitterSignal(tokenSymbol).catch(() => null) : null;
  const attentionScore = twitterSignal ? twitterSignal.attentionScore : placeholderAttentionScore(twitterUrl);
  const qualityScore = twitterSignal?.qualityScore || 0;
  const tweetCount = twitterSignal?.tweetCount || 0;

  const conversionScore = feesToConversionScore(lifetimeFeesSol);
  const unclaimedRatio = lifetimeFeesSol > 0 ? Math.min((lifetimeFeesSol - totalClaimed) / lifetimeFeesSol, 1) : 0;
  const momentumScore = Math.round(unclaimedRatio * 100);
  const potentialScore = computePotentialScore(attentionScore, conversionScore, momentumScore);
  const riskScore = computeRiskScore(isGraduated, lifetimeFeesSol, !!twitterUrl);
  const tag = computeTag(attentionScore, conversionScore, momentumScore);

  const TAG_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    'Breakout':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '▲' },
    'Fake Hype':   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '✕' },
    'Stealth Gem': { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '◆' },
    'No Signal':   { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '·' },
  };
  const tagCfg = TAG_CONFIG[tag] ?? TAG_CONFIG['No Signal'];

  const priceImpact = quote?.priceImpactPct ? parseFloat(quote.priceImpactPct) : null;
  const outAmount = quote?.outAmount ? (Number(BigInt(quote.outAmount)) / 1e6).toFixed(2) : null;

  const qualityLabel = qualityScore >= 70 ? 'Genuine Discussion' : qualityScore >= 40 ? 'Mixed Quality' : qualityScore > 0 ? 'Spam / Low Quality' : 'No Data';
  const qualityColor = qualityScore >= 70 ? '#34d399' : qualityScore >= 40 ? '#fbbf24' : qualityScore > 0 ? '#f87171' : '#6b7280';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,200,0.15) 0%, transparent 70%), #080612',
      color: '#fff',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        background: 'rgba(8,6,18,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, color: '#fff',
            }}>α</div>
            <span style={{ color: '#f0eaff', fontSize: '15px', fontWeight: 700 }}>Bags</span>
            <span style={{ color: '#a78bfa', fontSize: '15px', fontWeight: 700 }}>Alpha</span>
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            {tokenSymbol || mint.slice(0, 8) + '...'}
          </span>
        </div>
        <a href="/" style={{
          padding: '6px 14px', borderRadius: '8px',
          border: '1px solid rgba(139,92,246,0.2)',
          background: 'rgba(139,92,246,0.08)',
          color: '#a78bfa', fontSize: '12px',
          textDecoration: 'none',
        }}>← Back to Radar</a>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Token identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          {tokenImage ? (
            <img src={tokenImage} alt={tokenSymbol} width={56} height={56}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.3)' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.2)' }} />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f0eaff', letterSpacing: '-0.01em' }}>
              {tokenSymbol || 'Unknown Token'}
            </h1>
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{tokenName}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ padding: '4px 12px', borderRadius: '8px', background: tagCfg.bg, border: '1px solid ' + tagCfg.color + '30' }}>
              <span style={{ color: tagCfg.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
                {tagCfg.icon} {tag.toUpperCase()}
              </span>
            </div>
            <div style={{ color: tagCfg.color, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>{potentialScore}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.08em' }}>SIGNAL SCORE</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '16px', padding: '24px', marginBottom: '16px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>SCORE BREAKDOWN</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Attention', value: attentionScore, desc: 'Social signal strength from X', color: '#818cf8' },
              { label: 'Conversion', value: conversionScore, desc: 'On-chain trading activity (fees)', color: '#34d399' },
              { label: 'Momentum', value: momentumScore, desc: 'Fee velocity acceleration', color: '#fbbf24' },
            ].map(({ label, value, desc, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginLeft: '8px' }}>{desc}</span>
                  </div>
                  <span style={{ color, fontSize: '15px', fontWeight: 700 }}>{value}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: value + '%',
                    background: 'linear-gradient(90deg, ' + color + '60, ' + color + ')',
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Risk Score</span>
            <span style={{ color: riskScore > 70 ? '#f87171' : riskScore > 50 ? '#fbbf24' : '#34d399', fontWeight: 700, fontSize: '13px' }}>
              {riskScore} / 100
            </span>
          </div>
        </div>

        {/* Social signal analysis */}
        <div style={{
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '16px', padding: '24px', marginBottom: '16px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>SOCIAL SIGNAL ANALYSIS · CLAUDE NLP</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Tweets Found', value: tweetCount.toString(), sub: 'last 7 days', color: '#f0eaff' },
              { label: 'Avg Quality', value: qualityScore > 0 ? qualityScore + '/100' : 'N/A', sub: 'Claude verdict', color: qualityColor },
              { label: 'Signal Type', value: qualityLabel, sub: 'AI assessment', color: qualityColor },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                <div style={{ color, fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{sub}</div>
              </div>
            ))}
          </div>
          {tweetCount === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', margin: 0 }}>
              No recent tweets found for ${tokenSymbol}
            </p>
          )}
          {tweetCount > 0 && qualityScore < 40 && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>
                ⚠ Most tweets appear to be spam or low-quality shilling — social signal unreliable
              </p>
            </div>
          )}
          {tweetCount > 0 && qualityScore >= 70 && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ color: '#34d399', fontSize: '12px', margin: 0 }}>
                ✓ Genuine community discussion detected — social signal reliable
              </p>
            </div>
          )}
        </div>

        {/* On-chain activity */}
        <div style={{
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '16px', padding: '24px', marginBottom: '16px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>ON-CHAIN ACTIVITY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Lifetime Fees', value: lifetimeFeesSol.toFixed(4), sub: 'SOL', color: '#34d399' },
              { label: 'Total Claimed', value: totalClaimed.toFixed(4), sub: 'SOL', color: '#f0eaff' },
              { label: 'Unclaimed', value: (lifetimeFeesSol - totalClaimed).toFixed(4), sub: 'SOL', color: '#fbbf24' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                <div style={{ color, fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Pool Status</span>
            <span style={{ color: isGraduated ? '#34d399' : '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
              {isGraduated ? '✓ Graduated to DAMM v2' : '○ Pre-graduation (DBC)'}
            </span>
          </div>
        </div>

        {/* Creator */}
        {creators.length > 0 && (
          <div style={{
            background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: '16px', padding: '24px', marginBottom: '16px',
            backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>CREATOR</h3>
            {creators.map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {c.pfp && <img src={c.pfp} alt="" width={40} height={40} style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />}
                  <div>
                    <div style={{ color: '#f0eaff', fontWeight: 600, fontSize: '14px' }}>
                      {c.providerUsername || c.twitterUsername || 'Unknown'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '2px' }}>
                      {c.provider} · {c.isCreator ? 'Creator' : 'Admin'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#a78bfa', fontSize: '18px', fontWeight: 700 }}>{(c.royaltyBps / 100).toFixed(0)}%</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>fee share</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry simulation */}
        <div style={{
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>ENTRY SIMULATION — BUY 1 SOL</h3>
          {quote && outAmount ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginBottom: '8px' }}>You receive</div>
                <div style={{ color: '#f0eaff', fontSize: '22px', fontWeight: 700 }}>{outAmount}</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>tokens</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginBottom: '8px' }}>Price impact</div>
                <div style={{ color: priceImpact && priceImpact > 5 ? '#f87171' : '#34d399', fontSize: '22px', fontWeight: 700 }}>
                  {priceImpact ? priceImpact.toFixed(2) + '%' : 'N/A'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                  {priceImpact && priceImpact > 5 ? 'High — caution' : 'Acceptable'}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Quote unavailable for this token</p>
          )}
        </div>

        {/* CTA */}
        <a href={'https://bags.fm/' + mint} style={{
          display: 'block', textAlign: 'center',
          padding: '14px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))',
          border: '1px solid rgba(167,139,250,0.3)',
          color: '#a78bfa', fontSize: '14px', fontWeight: 700,
          textDecoration: 'none',
          transition: 'all 0.2s',
          boxShadow: '0 0 24px rgba(124,58,237,0.15)',
        }}>
          Trade on Bags.fm →
        </a>

      </main>
    </div>
  );
}