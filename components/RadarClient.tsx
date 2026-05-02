'use client';

import { useState, useEffect } from 'react';
import TokenCard from './TokenCard';
import { TokenScore } from '@/lib/score';

type Tag = 'All' | 'Breakout' | 'Stealth Gem' | 'Fake Hype' | 'No Signal';
type SortKey = 'potentialScore' | 'lifetimeFeesSol' | 'riskScore';

export default function RadarClient({ tokens }: { tokens: TokenScore[] }) {
  const [activeTag, setActiveTag] = useState<Tag>('All');
  const [sortKey, setSortKey] = useState<SortKey>('potentialScore');
  const [sortAsc, setSortAsc] = useState(false);
  useEffect(() => {
  const interval = setInterval(() => {
    window.location.reload();
  }, 60000);
  return () => clearInterval(interval);
}, []);

  const filtered = tokens
    .filter(t => activeTag === 'All' || t.tag === activeTag)
    .sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });

  const counts = {
    Breakout: tokens.filter(t => t.tag === 'Breakout').length,
    'Stealth Gem': tokens.filter(t => t.tag === 'Stealth Gem').length,
    'Fake Hype': tokens.filter(t => t.tag === 'Fake Hype').length,
    'No Signal': tokens.filter(t => t.tag === 'No Signal').length,
  };

  const TAG_STYLES: Record<string, string> = {
    'Breakout': 'text-emerald-400 border-emerald-400/40',
    'Stealth Gem': 'text-yellow-400 border-yellow-400/40',
    'Fake Hype': 'text-red-400 border-red-400/40',
    'No Signal': 'text-white/30 border-white/10',
    'All': 'text-white border-white/20',
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div>
      {/* Signal summary bar */}
      <div className="border-b border-white/10 px-6 py-3 flex gap-6 text-xs">
        <span className="text-emerald-400">▲ {counts.Breakout} BREAKOUT</span>
        <span className="text-yellow-400">◆ {counts['Stealth Gem']} STEALTH GEM</span>
        <span className="text-red-400">✕ {counts['Fake Hype']} FAKE HYPE</span>
        <span className="text-white/30">· {counts['No Signal']} NO SIGNAL</span>
      </div>

      {/* Filter + Sort bar */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Tag filters */}
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Breakout', 'Stealth Gem', 'Fake Hype'] as Tag[]).map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={
                "text-xs px-3 py-1 rounded border transition-colors " +
                (activeTag === tag
                  ? (TAG_STYLES[tag] + " bg-white/5")
                  : "text-white/30 border-white/10 hover:border-white/20")
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 items-center text-xs text-white/40">
          <span>Sort:</span>
          {([
            ['potentialScore', 'Score'],
            ['lifetimeFeesSol', 'Fees'],
            ['riskScore', 'Risk'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={
                "px-2 py-1 rounded border transition-colors " +
                (sortKey === key
                  ? "text-white border-white/30"
                  : "border-white/10 hover:border-white/20")
              }
            >
              {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Token grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center text-white/30 py-20">No tokens match this filter</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(t => <TokenCard key={t.mint} token={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}