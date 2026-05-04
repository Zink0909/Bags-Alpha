'use client';

import { useState } from 'react';

interface WatchButtonProps {
  creatorUsername: string;
  tokenSymbol: string;
}

export default function WatchButton({ creatorUsername, tokenSymbol }: WatchButtonProps) {
  const [step, setStep] = useState<'idle' | 'input' | 'loading' | 'done' | 'error'>('idle');
  const [chatId, setChatId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!creatorUsername) return null;

  const handleWatch = async () => {
    if (!chatId.trim()) return;
    setStep('loading');
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUsername: creatorUsername.replace('https://x.com/', '').split('/')[0],
          telegramChatId: chatId.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
      } else {
        setErrorMsg(data.error || 'Failed');
        setStep('error');
      }
    } catch {
      setErrorMsg('Network error');
      setStep('error');
    }
  };

  if (step === 'done') {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: '10px',
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.2)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ color: '#34d399', fontSize: '12px' }}>
          Watching {creatorUsername} — you will receive Telegram alerts when their tokens show signal.
        </span>
      </div>
    );
  }

  if (step === 'input' || step === 'loading' || step === 'error') {
    return (
      <div style={{
        padding: '16px', borderRadius: '12px',
        background: 'rgba(15,10,30,0.6)',
        border: '1px solid rgba(139,92,246,0.2)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 4px', color: '#f0eaff', fontSize: '13px', fontWeight: 600 }}>
            Watch @{creatorUsername.replace('https://x.com/', '').split('/')[0]}
          </p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
            Enter your Telegram Chat ID to receive alerts when this creator's tokens show a signal.
            Get your ID from <span style={{ color: '#a78bfa' }}>@userinfobot</span> on Telegram.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Your Telegram Chat ID (e.g. 8708177534)"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleWatch()}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#f0eaff', fontSize: '12px', outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={handleWatch}
            disabled={step === 'loading' || !chatId.trim()}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: step === 'loading' ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.3)',
              border: '1px solid rgba(167,139,250,0.3)',
              color: '#a78bfa', fontSize: '12px', fontWeight: 600,
              cursor: step === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {step === 'loading' ? 'Saving...' : 'Watch'}
          </button>
          <button
            onClick={() => { setStep('idle'); setChatId(''); setErrorMsg(''); }}
            style={{
              padding: '8px 12px', borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)', fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
        {step === 'error' && (
          <p style={{ margin: '8px 0 0', color: '#f87171', fontSize: '11px' }}>{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep('input')}
      style={{
        width: '100%', padding: '10px', borderRadius: '10px',
        background: 'transparent',
        border: '1px solid rgba(139,92,246,0.2)',
        color: 'rgba(167,139,250,0.7)', fontSize: '12px', fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.05em',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.08)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.4)';
        (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.2)';
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(167,139,250,0.7)';
      }}
    >
      Watch {tokenSymbol} Creator — Get Telegram Alerts
    </button>
  );
}
