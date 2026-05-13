'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorSearchPage() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = input.trim().replace(/^@/, '');
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/creators?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown((data.suggestions || []).length > 0);
        setActiveIndex(-1);
      } catch { setSuggestions([]); setShowDropdown(false); }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = (username: string) => {
    setShowDropdown(false);
    router.push(`/creator/${username}`);
  };

  const handleSearch = () => {
    const clean = input.trim().replace(/^@/, '');
    if (clean) navigate(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) navigate(suggestions[activeIndex]);
      else handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
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

        {/* Search box with dropdown */}
        <div style={{
          background: 'rgba(15,10,30,0.6)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
        }}>
          <div ref={containerRef} style={{ position: 'relative' }}>
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
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    paddingLeft: '30px', paddingRight: '14px',
                    paddingTop: '12px', paddingBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: showDropdown ? '10px 10px 0 0' : '10px',
                    color: '#f0eaff', fontSize: '15px', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'monospace',
                    borderBottom: showDropdown ? '1px solid rgba(139,92,246,0.1)' : undefined,
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!input.trim()}
                style={{
                  padding: '12px 24px', borderRadius: '10px',
                  background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(139,92,246,0.1)',
                  border: 'none',
                  color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontSize: '14px', fontWeight: 600,
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                Search →
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                width: 'calc(100% - 86px)',
                background: 'rgba(15,10,30,0.98)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                overflow: 'hidden',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
              }}>
                {suggestions.map((username, i) => (
                  <div
                    key={username}
                    onMouseDown={() => navigate(username)}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: i === activeIndex ? 'rgba(167,139,250,0.1)' : 'transparent',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{ color: 'rgba(167,139,250,0.4)', fontSize: '13px', fontFamily: 'monospace' }}>@</span>
                    <span style={{ color: '#f0eaff', fontSize: '14px', fontFamily: 'monospace' }}>
                      {username.slice(0, input.replace(/^@/, '').length) && (
                        <span style={{ color: '#a78bfa' }}>{username.slice(0, input.replace(/^@/, '').length)}</span>
                      )}
                      {username.slice(input.replace(/^@/, '').length)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
          Only creators with tokens in our current snapshot will show results.
        </div>
      </main>
    </div>
  );
}
