'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TokenCard from './TokenCard';
import { TokenScore } from '@/lib/score';

type Tab = 'All' | 'Breakout' | 'Stealth Gem' | 'Fake Hype' | 'Established';

export default function RadarClient({ tokens: initialTokens, topTokens }: { tokens: TokenScore[]; topTokens: TokenScore[] }) {
  const [tokens, setTokens] = useState<TokenScore[]>(initialTokens);
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [blink, setBlink] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connect = () => {
      if (esRef.current) esRef.current.close();
      const es = new EventSource('/api/stream');
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'tokens' && Array.isArray(msg.data)) {
            setTokens(msg.data);
            setLastUpdated(new Date());
          }
        } catch {}
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(connect, 10000);
      };
    };
    connect();
    return () => esRef.current?.close();
  }, []);

  useEffect(() => {
    const b = setInterval(() => setBlink(v => !v), 900);
    return () => clearInterval(b);
  }, []);

  const breakouts = tokens.filter(t => t.tag === 'Breakout');
  const stealths  = tokens.filter(t => t.tag === 'Stealth Gem');
  const fakeHypes = tokens.filter(t => t.tag === 'Fake Hype');

  const counts = { Breakout: breakouts.length, 'Stealth Gem': stealths.length, 'Fake Hype': fakeHypes.length };

  const SIGNAL_SECTIONS = [
    { tag: 'Breakout'    as Tab, tokens: breakouts, color: '#a78bfa', label: 'BREAKOUT',    icon: '▲', desc: 'Social attention + rising on-chain activity' },
    { tag: 'Stealth Gem' as Tab, tokens: stealths,  color: '#34d399', label: 'STEALTH GEM', icon: '◆', desc: 'Quiet accumulation — low attention, real capital' },
    { tag: 'Fake Hype'   as Tab, tokens: fakeHypes, color: '#f87171', label: 'FAKE HYPE',   icon: '✕', desc: 'High social noise, zero on-chain conviction' },
  ];

  const TAG_CONFIG: Record<string, { color: string; icon: string }> = {
    'Breakout':    { color: '#a78bfa', icon: '▲' },
    'Fake Hype':   { color: '#f87171', icon: '✕' },
    'Stealth Gem': { color: '#34d399', icon: '◆' },
    'No Signal':   { color: '#6b7280', icon: '·' },
  };

  const displaySections = activeTab === 'All'
    ? SIGNAL_SECTIONS
    : SIGNAL_SECTIONS.filter(s => s.tag === activeTab);

  const timeStr = lastUpdated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const TABS: { key: Tab; label: string; color: string }[] = [
    { key: 'All',          label: 'ALL',          color: '#a78bfa' },
    { key: 'Breakout',     label: 'BREAKOUT',     color: '#a78bfa' },
    { key: 'Stealth Gem',  label: 'STEALTH GEM',  color: '#34d399' },
    { key: 'Fake Hype',    label: 'FAKE HYPE',    color: '#f87171' },
    { key: 'Established',  label: 'ESTABLISHED',  color: '#f59e0b' },
  ];

  return (
    <div>
      {/* Stats bar */}
      <div style={{ borderBottom: '1px solid rgba(139,92,246,0.1)', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '32px', background: 'rgba(139,92,246,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: blink ? (connected ? '#a78bfa' : '#f87171') : 'transparent', border: '1px solid ' + (connected ? '#a78bfa' : '#f87171'), display: 'inline-block', transition: 'background 0.3s', boxShadow: blink ? '0 0 6px ' + (connected ? '#a78bfa' : '#f87171') : 'none' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.12em' }}>{connected ? 'LIVE' : 'RECONNECTING'}</span>
        </div>
        {[
          { tag: 'Breakout', color: '#a78bfa', icon: '▲' },
          { tag: 'Stealth Gem', color: '#34d399', icon: '◆' },
          { tag: 'Fake Hype', color: '#f87171', icon: '✕' },
        ].map(({ tag, color, icon }) => (
          <span key={tag} style={{ color, fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600 }}>
            {icon} {counts[tag as keyof typeof counts]} {tag.toUpperCase()}
          </span>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginLeft: 'auto' }}>
          {tokens.length} tokens · updated {timeStr}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(139,92,246,0.1)', padding: '0 32px', display: 'flex', gap: '0' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '14px 20px', border: 'none',
              borderBottom: isActive ? '2px solid ' + tab.color : '2px solid transparent',
              background: 'transparent',
              color: isActive ? tab.color : 'rgba(255,255,255,0.3)',
              fontSize: '11px', letterSpacing: '0.08em',
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

        {/* Established tab */}
        {activeTab === 'Established' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>◈ TOP BY LIFETIME FEES</span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(245,158,11,0.3), transparent)' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '0 0 20px' }}>
              Highest lifetime fees from our analyzed universe — market-tested tokens with proven trading activity.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topTokens.map((token, index) => {
                const cfg = TAG_CONFIG[token.tag] ?? TAG_CONFIG['No Signal'];
                return (
                  <Link key={token.mint} href={'/token/' + token.mint} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(245,158,11,0.08)', borderRadius: '12px', backdropFilter: 'blur(12px)', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.3)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(20,12,40,0.8)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.08)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,10,30,0.6)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: index < 3 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (index < 3 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: index < 3 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        #{index + 1}
                      </div>
                      {token.image ? (
                        <img src={token.image} alt={token.symbol} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#f0eaff', fontWeight: 700, fontSize: '14px' }}>{token.symbol}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token.name}</div>
                      </div>
                      <div style={{ padding: '2px 8px', borderRadius: '6px', background: cfg.color + '15', border: '1px solid ' + cfg.color + '30', flexShrink: 0 }}>
                        <span style={{ color: cfg.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>{cfg.icon} {token.tag}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 700 }}>{token.lifetimeFeesSol.toFixed(2)}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.06em' }}>SOL FEES</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '44px' }}>
                        <div style={{ color: cfg.color, fontSize: '18px', fontWeight: 800 }}>{token.potentialScore}</div>
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>SCORE</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Signal sections */}
        {activeTab !== 'Established' && (
          <>
            {displaySections.map(section => (
              section.tokens.length > 0 && (
                <div key={section.tag} style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: section.color, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>{section.icon} {section.label}</span>
                      <span style={{ padding: '1px 7px', borderRadius: '20px', background: section.color + '15', border: '1px solid ' + section.color + '30', color: section.color, fontSize: '10px', fontWeight: 600 }}>{section.tokens.length}</span>
                    </div>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, ' + section.color + '30, transparent)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{section.desc}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {section.tokens.slice(0, activeTab === 'All' ? 6 : 100).map(t => (
                      <TokenCard key={t.mint} token={t} />
                    ))}
                  </div>
                  {activeTab === 'All' && section.tokens.length > 6 && (
                    <button onClick={() => setActiveTab(section.tag as Tab)} style={{ marginTop: '12px', padding: '8px 16px', background: 'transparent', border: '1px solid ' + section.color + '30', borderRadius: '8px', color: section.color, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.05em' }}>
                      View all {section.tokens.length} {section.label} tokens →
                    </button>
                  )}
                </div>
              )
            ))}
            {displaySections.every(s => s.tokens.length === 0) && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '80px', fontSize: '13px' }}>No tokens match this filter</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}