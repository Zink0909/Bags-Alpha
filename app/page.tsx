import { analyzeTokens } from '@/lib/analyze';
import TokenCard from '@/components/TokenCard';

export const revalidate = 60;

export default async function Home() {
  const tokens = await analyzeTokens(30);

  const breakouts = tokens.filter(t => t.tag === 'Breakout');
  const stealthGems = tokens.filter(t => t.tag === 'Stealth Gem');
  const fakeHype = tokens.filter(t => t.tag === 'Fake Hype');
  const noSignal = tokens.filter(t => t.tag === 'No Signal');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold tracking-wider text-white">BAGS</span>
          <span className="text-lg font-bold tracking-wider text-emerald-400"> ALPHA</span>
          <span className="ml-3 text-xs text-white/40 uppercase tracking-widest">Early Signal Radar</span>
        </div>
        <div className="text-xs text-white/30">
          {tokens.length} tokens analyzed · updates every 60s
        </div>
      </header>

      {/* Signal summary bar */}
      <div className="border-b border-white/10 px-6 py-3 flex gap-6 text-xs">
        <span className="text-emerald-400">▲ {breakouts.length} BREAKOUT</span>
        <span className="text-yellow-400">◆ {stealthGems.length} STEALTH GEM</span>
        <span className="text-red-400">✕ {fakeHype.length} FAKE HYPE</span>
        <span className="text-white/30">· {noSignal.length} NO SIGNAL</span>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* Breakout section */}
        {breakouts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Breakout</span>
              <div className="flex-1 h-px bg-emerald-400/20" />
              <span className="text-xs text-white/30">High attention + rising trading</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {breakouts.map(t => <TokenCard key={t.mint} token={t} />)}
            </div>
          </section>
        )}

        {/* Stealth Gem section */}
        {stealthGems.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Stealth Gem</span>
              <div className="flex-1 h-px bg-yellow-400/20" />
              <span className="text-xs text-white/30">Low attention + rising trading</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stealthGems.map(t => <TokenCard key={t.mint} token={t} />)}
            </div>
          </section>
        )}

        {/* Fake Hype section */}
        {fakeHype.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">Fake Hype</span>
              <div className="flex-1 h-px bg-red-400/20" />
              <span className="text-xs text-white/30">High attention + no trading</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fakeHype.map(t => <TokenCard key={t.mint} token={t} />)}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
