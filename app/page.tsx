import RadarClient from '@/components/RadarClient';
import { getLatestSnapshot, getTopTokens } from '@/lib/supabase';
import { analyzeTokens } from '@/lib/analyze';

export const revalidate = 60;

export default async function Home() {
  let tokens = await getLatestSnapshot();
  if (tokens.length === 0) {
    tokens = await analyzeTokens(30);
  }

  const topTokens = await getTopTokens(10);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,200,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(60,100,200,0.08) 0%, transparent 60%), #080612',
      color: '#fff',
    }}>
      <header style={{
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', background: 'rgba(8,6,18,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>α</div>
            <div>
              <span style={{ color: '#f0eaff', fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em' }}>Bags</span>
              <span style={{ color: '#a78bfa', fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em' }}> Alpha</span>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Radar', active: true, href: '/' },
              { label: 'Watchlist', active: false, href: '/watchlist' },
              { label: 'Creator', active: false, href: '/creator' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: item.active ? 'rgba(167,139,250,0.12)' : 'transparent',
                color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                fontSize: '13px', fontWeight: item.active ? 600 : 400,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                border: item.active ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
              }}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
          Early Signal Radar · Bags.fm
        </div>
      </header>

      <div style={{ padding: '48px 32px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', fontSize: '11px', color: '#a78bfa', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '16px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            LIVE · POWERED BY X API + CLAUDE NLP
          </span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #f0eaff 0%, #a78bfa 50%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
          Find the next Bags.fm<br />gem before it moves.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: '0', maxWidth: '500px', lineHeight: 1.6 }}>
          We fuse X social signals with on-chain fee data to classify every token — Breakout, Stealth Gem, or Fake Hype — before the market prices it in.
        </p>
      </div>

      <RadarClient tokens={tokens} topTokens={topTokens} />
    </div>
  );
}