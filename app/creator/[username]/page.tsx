import { getCreatorTokens } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 300;

const TAG_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Breakout':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '▲' },
  'Fake Hype':   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '✕' },
  'Stealth Gem': { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '◆' },
  'No Signal':   { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '·' },
};

export default async function CreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const tokens = await getCreatorTokens(username);

  const bestTag = tokens.find(t => t.tag === 'Breakout')?.tag
    || tokens.find(t => t.tag === 'Stealth Gem')?.tag
    || tokens[0]?.tag || 'No Signal';

  const tagCfg = TAG_CONFIG[bestTag] ?? TAG_CONFIG['No Signal'];
  const avgScore = tokens.length > 0
    ? Math.round(tokens.reduce((s, t) => s + (t.potential_score || 0), 0) / tokens.length)
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,200,0.15) 0%, transparent 70%), #080612',
      color: '#fff',
    }}>
      <style>{`
        .token-card { transition: all 0.15s; }
        .token-card:hover { background: rgba(20,12,40,0.8) !important; transform: translateY(-1px); }
      `}</style>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', background: 'rgba(8,6,18,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff' }}>α</div>
            <span style={{ color: '#f0eaff', fontSize: '15px', fontWeight: 700 }}>Bags</span>
            <span style={{ color: '#a78bfa', fontSize: '15px', fontWeight: 700 }}>Alpha</span>
          </Link>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Radar', href: '/', active: false },
              { label: 'Watchlist', href: '/watchlist', active: false },
              { label: 'Creator', href: '/creator', active: true },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: item.active ? 'rgba(167,139,250,0.12)' : 'transparent',
                color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                fontSize: '13px', fontWeight: item.active ? 600 : 400,
                textDecoration: 'none',
                border: item.active ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
              }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/" style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.08)', color: '#a78bfa', fontSize: '12px', textDecoration: 'none' }}>
          ← Back to Radar
        </Link>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Creator identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', border: '2px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#a78bfa', fontWeight: 800 }}>
            {username[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#f0eaff', letterSpacing: '-0.01em' }}>
              @{username}
            </h1>
            <a href={`https://x.com/${username}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(167,139,250,0.6)', fontSize: '12px', textDecoration: 'none' }}>
              View on X →
            </a>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#f0eaff', fontSize: '22px', fontWeight: 700 }}>{tokens.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '2px' }}>tokens tracked</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: tagCfg.color, fontSize: '22px', fontWeight: 700 }}>{avgScore}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '2px' }}>avg signal score</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: '12px', background: tagCfg.bg, border: '1px solid ' + tagCfg.color + '30' }}>
              <div style={{ color: tagCfg.color, fontSize: '16px', fontWeight: 700 }}>{tagCfg.icon} {bestTag}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '2px' }}>current status</div>
            </div>
          </div>
        </div>

        {/* Token list */}
        {tokens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
            No tokens found for @{username}.<br />
            <span style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>This creator may not have any tokens in our current snapshot.</span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '16px' }}>
              TOKENS — {tokens.length} TRACKED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tokens.map((token: any) => {
                const cfg = TAG_CONFIG[token.tag] ?? TAG_CONFIG['No Signal'];
                return (
                  <Link key={token.mint} href={`/token/${token.mint}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'rgba(15,10,30,0.6)',
                      border: '1px solid rgba(139,92,246,0.12)',
                      borderRadius: '14px', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                    className="token-card">
                      {token.image ? (
                        <img src={token.image} alt={token.symbol} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', flexShrink: 0 }} />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ color: '#f0eaff', fontWeight: 700, fontSize: '14px' }}>{token.symbol}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: cfg.bg, border: '1px solid ' + cfg.color + '30', color: cfg.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>
                            {cfg.icon} {token.tag}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                            {(token.lifetime_fees_sol || 0).toFixed(4)} SOL fees
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: cfg.color, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{token.potential_score}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', marginTop: '3px', letterSpacing: '0.06em' }}>SIGNAL</div>
                      </div>

                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px', flexShrink: 0 }}>›</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}