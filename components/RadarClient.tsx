'use client';

import { useState, useEffect, useRef } from 'react';
import TokenCard from './TokenCard';
import { TokenScore } from '@/lib/score';

type Tag = 'All' | 'Breakout' | 'Stealth Gem' | 'Fake Hype';

export default function RadarClient({ tokens: initialTokens }: { tokens: TokenScore[] }) {
  const [tokens, setTokens] = useState<TokenScore[]>(initialTokens);
  const [activeTag, setActiveTag] = useState<Tag>('All');
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
        // Reconnect after 10 seconds
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

  const counts = {
    Breakout: breakouts.length,
    'Stealth Gem': stealths.length,
    'Fake Hype': fakeHypes.length,
  };

  const SECTIONS = [
    { tag: 'Breakout'    as Tag, tokens: breakouts, color: '#a78bfa', label: 'BREAKOUT',    icon: '▲', desc: 'Social attention + rising on-chain activity' },
    { tag: 'Stealth Gem' as Tag, tokens: stealths,  color: '#34d399', label: 'STEALTH GEM', icon: '◆', desc: 'Quiet accumulation — low attention, real capital' },
    { tag: 'Fake Hype'   as Tag, tokens: fakeHypes, color: '#f87171', label: 'FAKE HYPE',   icon: '✕', desc: 'High social noise, zero on-chain conviction' },
  ];

  const displaySections = activeTag === 'All'
    ? SECTIONS
    : SECTIONS.filter(s => s.tag === activeTag);

  const timeStr = lastUpdated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div>
      {/* Stats bar */}
      <div style={{
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        padding: '10px 32px',
        display: 'flex', alignItems: 'center', gap: '32px',
        background: 'rgba(139,92,246,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: blink ? (connected ? '#a78bfa' : '#f87171') : 'transparent',
            border: '1px solid ' + (connected ? '#a78bfa' : '#f87171'),
            display: 'inline-block',
            transition: 'background 0.3s',
            boxShadow: blink ? '0 0 6px ' + (connected ? '#a78bfa' : '#f87171') : 'none',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.12em' }}>
            {connected ? 'LIVE' : 'RECONNECTING'}
          </span>
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

      {/* Filter tabs */}
      <div style={{
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        padding: '0 32px', display: 'flex', gap: '0',
      }}>
        {(['All', 'Breakout', 'Stealth Gem', 'Fake Hype'] as Tag[]).map(tag => {
          const colors: Record<string, string> = {
            'All': '#a78bfa', 'Breakout': '#a78bfa', 'Stealth Gem': '#34d399', 'Fake Hype': '#f87171',
          };
          const isActive = activeTag === tag;
          return (
            <button key={tag} onClick={() => setActiveTag(tag)} style={{
              padding: '14px 20px', border: 'none',
              borderBottom: isActive ? '2px solid ' + colors[tag] : '2px solid transparent',
              background: 'transparent',
              color: isActive ? colors[tag] : 'rgba(255,255,255,0.3)',
              fontSize: '11px', letterSpacing: '0.08em',
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {tag.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {displaySections.map(section => (
          section.tokens.length > 0 && (
            <div key={section.tag} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: section.color, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {section.icon} {section.label}
                  </span>
                  <span style={{
                    padding: '1px 7px', borderRadius: '20px',
                    background: section.color + '15',
                    border: '1px solid ' + section.color + '30',
                    color: section.color, fontSize: '10px', fontWeight: 600,
                  }}>
                    {section.tokens.length}
                  </span>
                </div>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, ' + section.color + '30, transparent)' }} />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{section.desc}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {section.tokens.slice(0, activeTag === 'All' ? 6 : 100).map(t => (
                  <TokenCard key={t.mint} token={t} />
                ))}
              </div>

              {activeTag === 'All' && section.tokens.length > 6 && (
                <button onClick={() => setActiveTag(section.tag)} style={{
                  marginTop: '12px', padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid ' + section.color + '30',
                  borderRadius: '8px', color: section.color,
                  fontSize: '11px', cursor: 'pointer', letterSpacing: '0.05em',
                }}>
                  View all {section.tokens.length} {section.label} tokens →
                </button>
              )}
            </div>
          )
        ))}

        {displaySections.every(s => s.tokens.length === 0) && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '80px', fontSize: '13px' }}>
            No tokens match this filter
          </div>
        )}
      </div>
    </div>
  );
}