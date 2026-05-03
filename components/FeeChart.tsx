'use client';

import { useState } from 'react';

interface DataPoint {
  lifetime_fees_sol: number;
  captured_at: string;
}

export default function FeeChart({ data }: { data: DataPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length < 2) return null;

  const W = 680, H = 100, PAD = 12;
  const fees = data.map(d => d.lifetime_fees_sol);
  const minF = Math.min(...fees);
  const maxF = Math.max(...fees);
  const range = maxF - minF || 0.0001;
  const baseF = fees[0];

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((d.lifetime_fees_sol - minF) / range) * (H - PAD * 2),
    fee: d.lifetime_fees_sol,
    time: new Date(d.captured_at),
    delta: d.lifetime_fees_sol - baseF,
    pct: baseF > 0 ? ((d.lifetime_fees_sol - baseF) / baseF) * 100 : 0,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${PAD},${H - PAD} ` + polyline + ` ${W - PAD},${H - PAD}`;
  const totalDelta = fees[fees.length - 1] - baseF;
  const growthColor = totalDelta >= 0 ? '#34d399' : '#f87171';

  const active = hovered !== null ? pts[hovered] : null;

  const fmt = (d: Date) => d.toLocaleDateString('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  });

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.08em' }}>FEE GROWTH TREND</span>
        <span style={{ color: growthColor, fontSize: '11px', fontWeight: 600 }}>
          {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(4)} SOL
          <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: '6px' }}>
            ({totalDelta >= 0 ? '+' : ''}{baseF > 0 ? ((totalDelta / baseF) * 100).toFixed(1) : '0'}%) over {data.length} snapshots
          </span>
        </span>
      </div>

      {/* Hover info box */}
      <div style={{
        height: '36px', marginBottom: '6px', display: 'flex', alignItems: 'center',
        padding: '0 8px', borderRadius: '8px',
        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: active ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.15s',
      }}>
        {active ? (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{fmt(active.time)}</span>
            <span style={{ color: '#f0eaff', fontSize: '12px', fontWeight: 600 }}>{active.fee.toFixed(6)} SOL</span>
            <span style={{ color: active.delta >= 0 ? '#34d399' : '#f87171', fontSize: '11px' }}>
              {active.delta >= 0 ? '+' : ''}{active.delta.toFixed(6)} SOL
            </span>
            <span style={{ color: active.pct >= 0 ? '#34d399' : '#f87171', fontSize: '11px' }}>
              ({active.pct >= 0 ? '+' : ''}{active.pct.toFixed(2)}%)
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', marginLeft: 'auto' }}>vs start</span>
          </div>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>Hover over a point to see details</span>
        )}
      </div>

      {/* Chart */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: '80px', display: 'block', cursor: 'crosshair' }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={growthColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={growthColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          <polygon points={area} fill="url(#feeGrad)" />
          <polyline points={polyline} fill="none" stroke={growthColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover vertical line */}
          {active && (
            <line x1={active.x} y1={PAD} x2={active.x} y2={H - PAD}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
          )}

          {/* Data points */}
          {pts.map((p, i) => (
            <g key={i}>
              {/* Invisible hit area */}
              <circle
                cx={p.x} cy={p.y} r={16}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
              {/* Visible dot */}
              <circle
                cx={p.x} cy={p.y}
                r={hovered === i ? 4 : 2.5}
                fill={hovered === i ? '#fff' : growthColor}
                stroke={hovered === i ? growthColor : 'transparent'}
                strokeWidth="2"
                style={{ transition: 'r 0.1s, fill 0.1s' }}
                pointerEvents="none"
              />
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>{fmt(pts[0].time)}</span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>{fmt(pts[pts.length - 1].time)}</span>
      </div>
    </div>
  );
}
