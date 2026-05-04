'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorSearchPage() {
  const [input, setInput] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    const clean = input.trim().replace(/^@/, '');
    if (clean) router.push(`/creator/${clean}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,200,0.15) 0%, transparent 70%), #080612',
      color: '#fff',
    }}>
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

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 32px 40px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', marginBottom: '12px' }}>
            CREATOR LOOKUP
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: '32px', fontWeight: 800, color: '#f0eaff', letterSpacing: '-0.02em' }}>
            Search a Creator
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: 1.6 }}>
            Enter a creator's X username to see all their tracked tokens and signal scores.
          </p>
        </div>

        {/* Search box */}
        <div style={{
          background: 'rgba(15,10,30,0.6)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(167,139,250,0.5)', fontSize: '15px', pointerEvents: 'none',
              }}>@</span>
              <input
                type="text"
                placeholder="username"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '14px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '10px',
                  color: '#f0eaff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.2)')}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(139,92,246,0.1)',
                border: 'none',
                color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              Search →
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
          Only creators with tokens in our current snapshot will show results.
        </div>
      </main>
    </div>
  );
}