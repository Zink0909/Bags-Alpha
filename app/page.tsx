import { analyzeTokens } from '@/lib/analyze';
import RadarClient from '@/components/RadarClient';
 
export const revalidate = 60;
 
export default async function Home() {
  const tokens = await analyzeTokens(100);
 
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
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
      <RadarClient tokens={tokens} />
    </div>
  );
}
