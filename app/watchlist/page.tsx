'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WatchlistPage() {
  const [chatId, setChatId] = useState('');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    if (!chatId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/watchlist?chatId=' + encodeURIComponent(chatId.trim()));
      const data = await res.json();
      setWatchlist(data.data || []);
      setLoaded(true);
    } catch {
      setWatchlist([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (creatorUsername: string) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorUsername, telegramChatId: chatId }),
    });
    setWatchlist(w => w.filter(x => x.creator_username !== creatorUsername));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,200,0.15) 0%, transparent 70%), #080612',
      color: '#fff',
    }}>
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
              { label: 'Watchlist', href: '/watchlist', active: true },
              { label: 'Creator', href: '/creator', active: false },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: item.active ? 'rgba(167,139,250,0.12)' : 'transparent',
                color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                fontSize: '13px', fontWeight: item.active ? 600 : 400,
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: item.active ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
              }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f0eaff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Watchlist</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', margin: '0 0 32px', lineHeight: 1.6 }}>
          Track specific creators and receive Telegram alerts when their tokens show a signal.
        </p>

        {/* Chat ID input */}
        <div style={{
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '16px', padding: '24px', marginBottom: '24px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>YOUR TELEGRAM CHAT ID</h3>
          <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            Get your Chat ID by messaging <span style={{ color: '#a78bfa' }}>@userinfobot</span> on Telegram.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. 8708177534"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#f0eaff', fontSize: '13px', outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={handleLoad}
              disabled={loading || !chatId.trim()}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                background: 'rgba(139,92,246,0.3)',
                border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>

        {/* Watchlist results */}
        {loaded && (
          <div style={{
            background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: '16px', padding: '24px',
            backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>
              WATCHING {watchlist.length} CREATOR{watchlist.length !== 1 ? 'S' : ''}
            </h3>
            {watchlist.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>
                No creators on your watchlist yet. Go to a token's detail page and click "Watch Creator".
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {watchlist.map((item: any) => (
                  <div key={item.creator_username} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div>
                      <div style={{ color: '#f0eaff', fontSize: '13px', fontWeight: 600 }}>@{item.creator_username}</div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', marginTop: '2px' }}>
                        Added {new Date(item.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.creator_username)}
                      style={{
                        padding: '5px 12px', borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(248,113,113,0.2)',
                        color: '#f87171', fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}