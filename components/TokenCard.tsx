'use client';

import Link from 'next/link';
import { TokenScore } from '@/lib/score';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TAG_CONFIG: Record<string, {
  label: string;
  icon: string;
  accent: string;
  glow: string;
  badge: string;
}> = {
  'Breakout':    { label: 'BREAKOUT',    icon: '▲', accent: '#a78bfa', glow: 'rgba(167,139,250,0.2)', badge: 'rgba(167,139,250,0.15)' },
  'Fake Hype':   { label: 'FAKE HYPE',   icon: '✕', accent: '#f87171', glow: 'rgba(248,113,113,0.2)', badge: 'rgba(248,113,113,0.15)' },
  'Stealth Gem': { label: 'STEALTH GEM', icon: '◆', accent: '#34d399', glow: 'rgba(52,211,153,0.2)',  badge: 'rgba(52,211,153,0.15)'  },
  'No Signal':   { label: 'NO SIGNAL',   icon: '·', accent: '#6b7280', glow: 'rgba(107,114,128,0.1)', badge: 'rgba(107,114,128,0.1)'  },
};

export default function TokenCard({ token }: { token: TokenScore }) {
  const cfg = TAG_CONFIG[token.tag] ?? TAG_CONFIG['No Signal'];

  return (
    <Link href={'/token/' + token.mint} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="token-card" style={{
        background: 'rgba(15, 10, 30, 0.6)',
        border: '1px solid rgba(139, 92, 246, 0.12)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = '1px solid ' + cfg.accent + '40';
        el.style.boxShadow = '0 0 24px ' + cfg.glow + ', inset 0 1px 0 rgba(255,255,255,0.05)';
        el.style.transform = 'translateY(-2px)';
        el.style.background = 'rgba(20, 12, 40, 0.8)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = '1px solid rgba(139, 92, 246, 0.12)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
        el.style.background = 'rgba(15, 10, 30, 0.6)';
      }}>

        {/* Subtle gradient top border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, ' + cfg.accent + '60, transparent)',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {token.image ? (
              <img src={token.image} alt={token.symbol} width={36} height={36}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ color: '#f0eaff', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em' }}>
                {token.symbol}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '1px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {token.name}
              </div>
            </div>
          </div>

          {/* Tag badge */}
          <div style={{
            padding: '3px 8px', borderRadius: '6px',
            background: cfg.badge,
            border: '1px solid ' + cfg.accent + '30',
            display: 'flex', alignItems: 'center', gap: '4px',
            flexShrink: 0,
          }}>
            <span style={{ color: cfg.accent, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>

        {/* Potential score */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.08em' }}>SIGNAL SCORE</span>
            <span style={{ color: cfg.accent, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>{token.potentialScore}</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: token.potentialScore + '%',
              background: 'linear-gradient(90deg, ' + cfg.accent + '60, ' + cfg.accent + ')',
              borderRadius: '2px',
              boxShadow: '0 0 8px ' + cfg.glow,
            }} />
          </div>
        </div>

        {/* Three scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
          {[
            { label: 'Attention', value: token.attentionScore, color: '#818cf8' },
            { label: 'Conversion', value: token.conversionScore, color: '#34d399' },
            { label: 'Momentum', value: token.momentumScore, color: '#fbbf24' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              padding: '7px 6px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', marginBottom: '3px', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ color, fontSize: '15px', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
            {token.lifetimeFeesSol.toFixed(4)} SOL fees
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {token.capturedAt && (
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px' }}>
                {timeAgo(token.capturedAt)}
              </span>
            )}
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: token.riskScore > 70 ? '#f87171' : token.riskScore > 50 ? '#fbbf24' : 'rgba(255,255,255,0.25)',
            }}>
              Risk {token.riskScore}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}