'use client';

import { TokenScore } from "@/lib/score";
import Link from 'next/link';

const TAG_STYLES: Record<string, string> = {
  "Breakout":    "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  "Fake Hype":   "bg-red-400/10 text-red-400 border-red-400/30",
  "Stealth Gem": "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  "No Signal":   "bg-white/5 text-white/30 border-white/10",
};
const TAG_ICONS: Record<string, string> = {
  "Breakout":    "▲",
  "Fake Hype":   "✕",
  "Stealth Gem": "◆",
  "No Signal":   "·",
};
export default function TokenCard({ token }: { token: TokenScore }) {
  const tagStyle = TAG_STYLES[token.tag] ?? TAG_STYLES["No Signal"];
  const tagIcon  = TAG_ICONS[token.tag]  ?? "·";
  const bagsUrl  = "https://bags.fm/" + token.mint;
  return (
    <Link href={"/token/" + token.mint} className="block border border-white/10 rounded-lg p-4 hover:border-white/25 hover:bg-white/[0.02] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {token.image && (<img src={token.image} alt={token.symbol} width={32} height={32} className="rounded-full w-8 h-8 object-cover" />)}
          <div>
            <div className="text-sm font-bold text-white">{token.symbol}</div>
            <div className="text-xs text-white/40 truncate max-w-[120px]">{token.name}</div>
          </div>
        </div>
        <span className={"text-xs px-2 py-0.5 rounded border font-bold shrink-0 " + tagStyle}>{tagIcon} {token.tag}</span>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Potential Score</span>
          <span className="text-white font-bold">{token.potentialScore}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: token.potentialScore + "%" }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div><div className="text-xs text-white/30">Attention</div><div className="text-sm font-bold text-white/70">{token.attentionScore}</div></div>
        <div><div className="text-xs text-white/30">Conversion</div><div className="text-sm font-bold text-white/70">{token.conversionScore}</div></div>
        <div><div className="text-xs text-white/30">Momentum</div><div className="text-sm font-bold text-white/70">{token.momentumScore}</div></div>
      </div>
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>{token.lifetimeFeesSol.toFixed(4)} SOL fees</span>
        <span className={token.riskScore > 70 ? "text-red-400/70" : "text-white/30"}>Risk {token.riskScore}</span>
      </div>
    </Link>
  );
}